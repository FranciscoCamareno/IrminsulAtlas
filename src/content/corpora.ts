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

// Reorders the main-story milestones to the declared ladder and recomputes the
// revelation rank of events, which the base dossier set from its own ladder.
function applyLadder(data: Dataset, ladder: readonly string[]) {
  const main = data.milestones.filter((item) => item.track === 'main');
  if (
    new Set(ladder).size !== ladder.length ||
    ladder.length !== main.length ||
    !main.every((item) => ladder.includes(item.id))
  )
    throw new Error(
      'La escalera declarada debe contener cada hito principal exactamente una vez',
    );
  const byId = new Map(data.milestones.map((item) => [item.id, item]));
  data.milestones = [
    ...ladder.map((id) => byId.get(id)!),
    ...data.milestones.filter((item) => item.track !== 'main'),
  ];
  const rank = new Map(ladder.map((id, index) => [id, index + 1]));
  for (const event of data.events)
    event.revelation = {
      ...event.revelation,
      order: Math.max(
        0,
        ...event.spoilerRequirements.map((id) => rank.get(id) ?? 0),
      ),
    };
}

// Pure composition. A draft is authoring work in progress: it never reaches the
// published dataset, nor does anything that only exists because of it.
export function composeCorpora(
  base: Dataset,
  corpora: readonly CorpusFile[],
): Dataset {
  const data: Dataset = structuredClone(base);
  let mainLadder: readonly string[] | null = null;
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
    if (corpus.ladder) mainLadder = corpus.ladder;
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
  if (mainLadder) applyLadder(data, mainLadder);
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
