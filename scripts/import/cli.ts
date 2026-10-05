import process from 'node:process';
import console from 'node:console';
import { resolve } from 'node:path';
import {
  EvidenceRegistrySchema,
  ImportSelectionSchema,
  SnapshotManifestSchema,
} from '../../src/domain/schema.ts';
import {
  findRegistryIssues,
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
  } else if (command === 'evidence' && !id) {
    // Compares every pinned fragment with the accepted import. Without one it
    // cannot say anything, and says so instead of passing.
    const registry = parse(
      EvidenceRegistrySchema,
      await readJson('content/editorial/genshin-evidence.json'),
      'genshin-evidence.json',
    );
    const dossier = (await readJson(
      'content/editorial/genshin-dossier.json',
    )) as {
      events: Array<{ id: string }>;
    };
    const events = new Set(dossier.events.map((event) => event.id));
    const structural = findRegistryIssues(registry, events);
    const current = await readAccepted(store);
    if (!current)
      fail(
        'NO_ACCEPTED_VERSION',
        'content/imported/animegame/accepted.json',
        '',
        null,
        'No hay importación aceptada: las referencias a fragmentos no pueden verificarse. Ejecutar acquire, import y promote.',
      );
    const textual = verifyAgainstImport(registry, current.dataset);
    const issues = [...structural, ...textual];
    console.log(
      stableJson({
        status: issues.some((issue) => issue.severity === 'error')
          ? 'rejected'
          : 'valid',
        importVersion: current.pointer.version,
        claims: registry.claims.length,
        sources: registry.sources.length,
        // Coverage is reported, never hidden: events with no claim are unreviewed.
        coverage: {
          eventsWithClaims: [...events].filter((id) =>
            registry.claims.some((claim) => claim.eventIds.includes(id)),
          ).length,
          eventsWithoutClaims: [...events].filter(
            (id) =>
              !registry.claims.some((claim) => claim.eventIds.includes(id)),
          ),
          verifiedSupports: registry.claims.flatMap((claim) =>
            claim.support.filter(
              (support) => support.verification === 'verified',
            ),
          ).length,
          claimsReviewed: registry.claims.filter(
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
      'Uso: node scripts/import/cli.ts acquire|import|validate [ID]|diff ID|promote ID|evidence',
    );
    process.exitCode = 1;
  }
} catch (error) {
  const report = await writeFailure(resolve('.validation/p2/reports'), error);
  console.error(`Importación detenida. Informe: ${report}`);
  process.exitCode = 1;
}
