import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CorpusFileSchema,
  DatasetSchema,
  type CorpusFile,
  type Dataset,
} from '../domain/schema';
import { findIntegrityIssues } from '../domain/integrity';
import { findRegistryIssues } from '../domain/evidence-integrity';
import { loadDossierContent, registrySourceToSource } from './dossier';

const directory = 'content/editorial/corpora';

export async function loadCorpusFiles(): Promise<CorpusFile[]> {
  const names = (await readdir(resolve(directory)).catch(() => []))
    .filter((name) => name.endsWith('.json'))
    .sort();
  return Promise.all(
    names.map(async (name) =>
      CorpusFileSchema.parse(
        JSON.parse(await readFile(resolve(directory, name), 'utf8')),
      ),
    ),
  );
}

// Pure composition. A draft is authoring work in progress: it never reaches the
// published dataset, nor does anything that only exists because of it.
export function composeCorpora(
  base: Dataset,
  corpora: readonly CorpusFile[],
): Dataset {
  const data: Dataset = structuredClone(base);
  for (const corpus of corpora) {
    const published = <T extends { editorialStatus: string }>(items: T[]) =>
      items.filter((item) => item.editorialStatus !== 'draft');
    const events = published(corpus.events);
    const eventIds = new Set(events.map((event) => event.id));
    const registryIssues = findRegistryIssues(
      corpus.evidence,
      new Set(corpus.events.map((event) => event.id)),
    ).filter((issue) => issue.severity === 'error');
    if (registryIssues.length)
      throw new Error(
        `Registro de evidencias del corpus ${corpus.corpus} inválido:\n` +
          registryIssues
            .map((issue) => `${issue.code} ${issue.path}: ${issue.message}`)
            .join('\n'),
      );
    data.milestones.push(...corpus.milestones);
    data.eras.push(...corpus.eras);
    data.entities.push(...published(corpus.entities));
    data.events.push(...events);
    const draftIds = new Set(
      corpus.events
        .filter((event) => event.editorialStatus === 'draft')
        .map((event) => event.id),
    );
    data.relations.push(
      ...published(corpus.relations).filter(
        (relation) =>
          !draftIds.has(relation.fromEventId) &&
          !draftIds.has(relation.toEventId),
      ),
    );
    data.sources.push(...corpus.evidence.sources.map(registrySourceToSource));
    // A claim about several events survives while any of its events does; one
    // only about drafts is dropped, so nothing leaks through the claim list.
    data.claims.push(
      ...corpus.evidence.claims
        .filter((claim) => claim.eventIds.some((id) => eventIds.has(id)))
        .map((claim) => ({
          ...claim,
          eventIds: claim.eventIds.filter((id) => eventIds.has(id)),
        })),
    );
  }
  const parsed = DatasetSchema.parse(data);
  const issues = findIntegrityIssues(parsed);
  if (issues.length)
    throw new Error(
      issues.map((issue) => issue.path + ': ' + issue.message).join('\n'),
    );
  return parsed;
}

export async function loadAtlasContent(): Promise<Dataset> {
  return composeCorpora(await loadDossierContent(), await loadCorpusFiles());
}
