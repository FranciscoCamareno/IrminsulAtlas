import process from 'node:process';
import console from 'node:console';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CorpusFileSchema,
  EvidenceRegistrySchema,
  DossierMapSchema,
  ImportSelectionSchema,
  SnapshotManifestSchema,
} from '../../src/domain/schema.ts';
import {
  findRegistryIssues,
  findDossierReviewIssues,
  verifyAgainstImport,
} from '../../src/domain/evidence-integrity.ts';
import { acquireSnapshot } from './acquire.ts';
import {
  acceptedSubset,
  compareImports,
  importSnapshot,
  promoteCandidate,
  readAccepted,
  readCandidate,
  writeFailure,
} from './pipeline.ts';
import { fail, parse, readJson, stableJson } from './shared.ts';

// Deliberately fixed project-relative locations; never reads the provider during build.
const candidates = resolve('.validation/p2/candidates');
const store = resolve('content/imported/animegame');
const cache = resolve('.validation/p1/raw');
const [command, id, ...extra] = process.argv.slice(2);
try {
  if (extra.length)
    fail(
      'INVALID_ARGUMENTS',
      'cli',
      'arguments',
      null,
      'Argumentos no reconocidos',
    );
  if (command === 'acquire' || command === 'import') {
    if (id)
      fail('INVALID_ARGUMENTS', 'cli', 'id', id, 'Esta orden no recibe ID');
    const manifest = parse(
      SnapshotManifestSchema,
      await readJson('docs/validation/p1/snapshot-manifest.json'),
      'snapshot-manifest.json',
    );
    if (command === 'acquire') {
      await acquireSnapshot(manifest, cache);
      console.log(`Snapshot verificado: ${manifest.files.length} archivos.`);
    } else {
      const selection = parse(
        ImportSelectionSchema,
        await readJson('scripts/import/selection.json'),
        'selection.json',
      );
      const result = await importSnapshot({
        manifest,
        selection,
        cache,
        candidates,
        store,
      });
      console.log(
        stableJson({
          candidate: result.id,
          ...result.report,
          diff: result.diff,
        }),
      );
      if (result.report.status === 'rejected') process.exitCode = 1;
    }
  } else if (command === 'promote' && id) {
    console.log(stableJson(await promoteCandidate(candidates, id, store)));
  } else if ((command === 'validate' || command === 'diff') && id) {
    const candidate = await readCandidate(candidates, id);
    const current = await readAccepted(store);
    console.log(
      stableJson({
        candidate: id,
        status: 'valid',
        diff: compareImports(
          current?.dataset ?? null,
          acceptedSubset(candidate),
        ),
      }),
    );
  } else if (command === 'validate' && !id) {
    const current = await readAccepted(store);
    if (!current)
      fail(
        'NO_ACCEPTED_VERSION',
        'content/imported/animegame/accepted.json',
        '',
        null,
        'Todavía no hay una importación aceptada; importar y revisar un candidato primero',
      );
    console.log(
      stableJson({
        status: 'valid',
        ...current.pointer,
        sources: current.dataset.sources.length,
      }),
    );
  } else if (command === 'evidence') {
    // Compares every pinned fragment with the accepted import. Without one it
    // cannot say anything, and says so instead of passing.
    const registry = parse(
      EvidenceRegistrySchema,
      await readJson('content/editorial/genshin-evidence.json'),
      'genshin-evidence.json',
    );
    const dossier = DossierMapSchema.parse(
      await readJson('content/editorial/genshin-dossier.json'),
    );
    const corpusDirectory = resolve('content/editorial/corpora');
    const corpora = [];
    for (const name of (await readdir(corpusDirectory).catch(() => []))
      .filter((file) => file.endsWith('.json'))
      .sort())
      corpora.push(
        parse(
          CorpusFileSchema,
          await readJson(`content/editorial/corpora/${name}`),
          name,
        ),
      );
    const events = new Set([
      ...dossier.events.map((event) => event.id),
      ...corpora.flatMap((corpus) => corpus.events.map((event) => event.id)),
    ]);
    const allClaims = [
      ...registry.claims,
      ...corpora.flatMap((corpus) => corpus.evidence.claims),
    ];
    const structural = [
      ...findRegistryIssues(registry, events),
      ...findDossierReviewIssues(dossier, registry),
      ...corpora.flatMap((corpus) =>
        findRegistryIssues(corpus.evidence, events),
      ),
    ];
    // Candidate verification is read-only: a broken fragment cannot replace
    // the accepted import just to discover the mismatch afterwards.
    const current = id ? null : await readAccepted(store);
    const imported = id
      ? acceptedSubset(await readCandidate(candidates, id))
      : current?.dataset;
    if (!imported)
      fail(
        'NO_ACCEPTED_VERSION',
        'content/imported/animegame/accepted.json',
        '',
        null,
        'No hay importación aceptada: las referencias a fragmentos no pueden verificarse. Ejecutar acquire, import y promote.',
      );
    const textual = [
      ...verifyAgainstImport(registry, imported),
      ...corpora.flatMap((corpus) =>
        verifyAgainstImport(corpus.evidence, imported),
      ),
    ];
    const issues = [...structural, ...textual];
    console.log(
      stableJson({
        status: issues.some((issue) => issue.severity === 'error')
          ? 'rejected'
          : 'valid',
        ...(id
          ? { candidate: id }
          : { importVersion: current!.pointer.version }),
        corpora: corpora.map((corpus) => corpus.corpus),
        claims: allClaims.length,
        sources:
          registry.sources.length +
          corpora.reduce(
            (sum, corpus) => sum + corpus.evidence.sources.length,
            0,
          ),
        // Coverage is reported, never hidden: events with no claim are unreviewed.
        coverage: {
          eventsWithClaims: [...events].filter((id) =>
            allClaims.some((claim) => claim.eventIds.includes(id)),
          ).length,
          eventsWithoutClaims: [...events].filter(
            (id) => !allClaims.some((claim) => claim.eventIds.includes(id)),
          ),
          verifiedSupports: allClaims.flatMap((claim) =>
            claim.support.filter(
              (support) => support.verification === 'verified',
            ),
          ).length,
          claimsReviewed: allClaims.filter(
            (claim) => claim.review.status === 'reviewed',
          ).length,
        },
        issues,
      }),
    );
    if (issues.some((issue) => issue.severity === 'error'))
      process.exitCode = 1;
  } else {
    console.error(
      'Uso: node scripts/import/cli.ts acquire|import|validate [ID]|diff ID|promote ID|evidence [ID]',
    );
    process.exitCode = 1;
  }
} catch (error) {
  const report = await writeFailure(resolve('.validation/p2/reports'), error);
  console.error(`Importación detenida. Informe: ${report}`);
  process.exitCode = 1;
}
