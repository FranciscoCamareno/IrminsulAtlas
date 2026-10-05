import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  open,
} from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  AcceptedImportSchema,
  ImportCandidateSchema,
  ImportedDatasetSchema,
  ImportReportSchema,
  Sha256Schema,
  type AcceptedImport,
  type ImportCandidate,
  type ImportedDataset,
  type ImportDiff,
  type ImportIssue,
  type ImportReport,
  type SnapshotManifest,
  type ImportSelection,
} from '../../src/domain/schema.ts';
import { findImportIssues } from '../../src/domain/import-integrity.ts';
import { readSnapshot } from './acquire.ts';
import { normalizeSnapshot } from './adapter.ts';
import {
  ADAPTER,
  exactJson,
  ImportFailure,
  fail,
  parse,
  readJson,
  safePath,
  sha256,
  stableJson,
} from './shared.ts';

export function validateCandidate(candidate: ImportCandidate): ImportIssue[] {
  const issues = findImportIssues(
    candidate.dataset,
    candidate.selection.exclusions,
  );
  if (
    candidate.dataset.selectionSha256 !==
    sha256(stableJson(candidate.selection))
  )
    fail(
      'INVALID_PROVENANCE',
      'candidate.json',
      'selectionSha256',
      null,
      'La selección no coincide con el dataset',
    );
  for (const source of candidate.dataset.sources) {
    for (const segment of source.segments) {
      if (
        segment.text.status === 'available' &&
        sha256(segment.text.value) !== segment.text.sha256
      )
        issues.push({
          severity: 'error',
          code: 'TEXT_CHECKSUM',
          category: source.kind,
          file: segment.locator.path,
          field: segment.locator.pointer,
          id: segment.externalId,
          message: 'El texto no coincide con su hash',
        });
    }
  }
  return issues;
}

export function acceptedSubset(candidate: ImportCandidate): ImportedDataset {
  return {
    ...candidate.dataset,
    sources: candidate.dataset.sources.filter(
      (source) =>
        !candidate.selection.exclusions.some(
          (item) => item.sourceId === source.id,
        ),
    ),
  };
}

export function compareImports(
  previous: ImportedDataset | null,
  next: ImportedDataset,
): ImportDiff {
  const before = new Map(
    previous?.sources.map((source) => [source.id, source]) ?? [],
  );
  const after = new Map(next.sources.map((source) => [source.id, source]));
  const diff: ImportDiff = {
    added: [],
    changed: [],
    removed: [],
    unchanged: [],
  };
  for (const [id, source] of after) {
    const old = before.get(id);
    if (!old) diff.added.push(id);
    else if (stableJson(old) !== stableJson(source)) diff.changed.push(id);
    else diff.unchanged.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) diff.removed.push(id);
  for (const values of Object.values(diff)) values.sort();
  return diff;
}

export async function readAccepted(
  store: string,
): Promise<{ pointer: AcceptedImport; dataset: ImportedDataset } | null> {
  await mkdir(store, { recursive: true });
  const pointerPath = await safePath(store, 'accepted.json');
  let raw: string;
  try {
    raw = await readFile(pointerPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const pointer = parse(
    AcceptedImportSchema,
    exactJson(raw, pointerPath),
    pointerPath,
  );
  const path = await safePath(
    store,
    `versions/${pointer.version}/sources.json`,
  );
  const dataset = parse(ImportedDatasetSchema, await readJson(path), path);
  if (sha256(stableJson(dataset)) !== pointer.version)
    fail(
      'CHECKSUM_MISMATCH',
      path,
      '',
      null,
      'La versión aceptada fue modificada',
    );
  // Declared gaps of incomplete sources are warnings; only errors invalidate.
  const issues = findImportIssues(dataset, []).filter(
    (issue) => issue.severity === 'error',
  );
  if (issues.length) throw new ImportFailure(issues[0]!);
  return { pointer, dataset };
}

export function reportFor(
  candidate: ImportCandidate | null,
  issues: ImportIssue[],
  filesVerified = 0,
): ImportReport {
  const all = candidate?.dataset.sources ?? [];
  const accepted = candidate ? acceptedSubset(candidate).sources : [];
  return ImportReportSchema.parse({
    schemaVersion: 1,
    status: issues.some((issue) => issue.severity === 'error')
      ? 'rejected'
      : 'valid',
    snapshotCommit: candidate?.dataset.snapshot.commit ?? null,
    adapterVersion: ADAPTER,
    filesVerified,
    sourcesProcessed: all.length,
    sourcesAccepted: accepted.length,
    sourcesExcluded: all.length - accepted.length,
    segmentsAccepted: accepted.reduce(
      (sum, source) => sum + source.segments.length,
      0,
    ),
    unresolvedTexts: all
      .flatMap((source) => source.segments)
      .filter((segment) => segment.text.status === 'missing').length,
    categories: [...new Set(all.map((source) => source.kind))]
      .sort()
      .map((category) => ({
        category,
        processed: all.filter((source) => source.kind === category).length,
        accepted: accepted.filter((source) => source.kind === category).length,
        excluded:
          all.filter((source) => source.kind === category).length -
          accepted.filter((source) => source.kind === category).length,
      })),
    issues,
  });
}
export function reportMarkdown(
  report: ImportReport,
  diff?: ImportDiff,
): string {
  const lines = [
    '# Informe de importación',
    '',
    `Estado: **${report.status}**. Snapshot: \`${report.snapshotCommit ?? 'no disponible'}\`.`,
    '',
    `Archivos verificados: ${report.filesVerified}. Fuentes procesadas: ${report.sourcesProcessed}; aceptables: ${report.sourcesAccepted}; excluidas: ${report.sourcesExcluded}.`,
    `Segmentos aceptables: ${report.segmentsAccepted}. Textos sin resolver (incluidas exclusiones): ${report.unresolvedTexts}.`,
    '',
    ...report.categories.map(
      (row) =>
        `- ${row.category}: ${row.processed} procesadas, ${row.accepted} aceptables, ${row.excluded} excluidas.`,
    ),
    '',
    '## Incidencias',
    '',
    ...report.issues.map(
      (issue) =>
        `- **${issue.severity} / ${issue.code}** (${issue.category}): \`${issue.file}#${issue.field}\`, ID \`${issue.id ?? '-'}\`: ${issue.message}`,
    ),
  ];
  if (diff)
    lines.push(
      '',
      '## Comparación',
      '',
      ...Object.entries(diff).map(
        ([key, ids]) =>
          `- ${key}: ${ids.length}${ids.length ? ' — ' + ids.join(', ') : ''}`,
      ),
    );
  lines.push(
    '',
    'La aceptación es técnica y local. No aprueba eventos, interpreta condiciones de spoilers ni publica el sitio.',
    '',
  );
  return lines.join('\n');
}

export async function importSnapshot(options: {
  manifest: SnapshotManifest;
  selection: ImportSelection;
  cache: string;
  candidates: string;
  store: string;
}): Promise<{ id: string; report: ImportReport; diff: ImportDiff }> {
  await mkdir(options.candidates, { recursive: true });
  const bytes = await readSnapshot(options.manifest, options.cache);
  const dataset = normalizeSnapshot(options.manifest, options.selection, bytes);
  const candidate = parse(
    ImportCandidateSchema,
    { schemaVersion: 1, dataset, selection: options.selection },
    'candidate.json',
  );
  const issues = validateCandidate(candidate);
  const report = reportFor(candidate, issues, bytes.size);
  const body = stableJson(candidate);
  const id = sha256(body);
  const directory = await safePath(options.candidates, id);
  await mkdir(directory, { recursive: true });
  const target = await safePath(options.candidates, `${id}/candidate.json`);
  try {
    await writeFile(target, body, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if ((await readFile(target, 'utf8')) !== body)
      fail(
        'CHECKSUM_MISMATCH',
        target,
        '',
        id,
        'Candidato existente modificado',
      );
  }
  const prior = await readAccepted(options.store);
  const diff = compareImports(
    prior?.dataset ?? null,
    acceptedSubset(candidate),
  );
  await writeFile(
    await safePath(options.candidates, `${id}/report.json`),
    stableJson(report),
  );
  await writeFile(
    await safePath(options.candidates, `${id}/report.md`),
    reportMarkdown(report, diff),
  );
  await writeFile(
    await safePath(options.candidates, `${id}/diff.json`),
    stableJson(diff),
  );
  return { id, report, diff };
}

export async function readCandidate(
  candidates: string,
  id: string,
): Promise<ImportCandidate> {
  parse(Sha256Schema, id, 'candidate', 'id');
  const path = await safePath(candidates, `${id}/candidate.json`);
  const candidate = parse(ImportCandidateSchema, await readJson(path), path);
  if (sha256(stableJson(candidate)) !== id)
    fail(
      'CHECKSUM_MISMATCH',
      path,
      '',
      id,
      'Candidato modificado después de generarse',
    );
  const issues = validateCandidate(candidate);
  const error = issues.find((issue) => issue.severity === 'error');
  if (error) throw new ImportFailure(error);
  return candidate;
}

export async function promoteCandidate(
  candidates: string,
  id: string,
  store: string,
): Promise<AcceptedImport> {
  // Serialize writers. The pointer is the only mutable accepted state; version
  // directories are content-addressed and never overwritten.
  await mkdir(store, { recursive: true });
  const lockPath = await safePath(store, 'promotion.lock');
  const lock = await open(lockPath, 'wx').catch(() =>
    fail(
      'PROMOTION_LOCKED',
      lockPath,
      '',
      null,
      'Otra promoción está activa; no se cambió la versión aceptada',
    ),
  );
  try {
    const candidate = await readCandidate(candidates, id);
    const accepted = acceptedSubset(candidate);
    if (!accepted.sources.length)
      fail(
        'EMPTY_SELECTION',
        'candidate.json',
        'sources',
        id,
        'No se acepta un conjunto vacío',
      );
    const current = await readAccepted(store);
    const body = stableJson(accepted);
    const version = sha256(body);
    if (current?.pointer.version === version) return current.pointer;
    const directory = await safePath(store, `versions/${version}`);
    await mkdir(directory, { recursive: true });
    const versionPath = await safePath(
      store,
      `versions/${version}/sources.json`,
    );
    try {
      await writeFile(versionPath, body, { flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if ((await readFile(versionPath, 'utf8')) !== body)
        fail(
          'CHECKSUM_MISMATCH',
          versionPath,
          '',
          version,
          'Versión inmutable modificada',
        );
    }
    if (sha256(await readFile(versionPath)) !== version)
      fail(
        'CHECKSUM_MISMATCH',
        versionPath,
        '',
        version,
        'Escritura incompleta',
      );
    const pointer: AcceptedImport = {
      schemaVersion: 1,
      version,
      previousVersion: current?.pointer.version ?? null,
    };
    const temporary = await safePath(store, `accepted-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, stableJson(pointer), { flag: 'wx' });
      await rename(temporary, await safePath(store, 'accepted.json'));
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
    return pointer;
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

export async function writeFailure(
  directory: string,
  error: unknown,
): Promise<string> {
  const issue: ImportIssue =
    error instanceof ImportFailure
      ? error.issue
      : {
          severity: 'error',
          code: 'IO_ERROR',
          category: 'operation',
          file:
            error instanceof Error && 'path' in error ? String(error.path) : '',
          field:
            error instanceof Error && 'code' in error ? String(error.code) : '',
          id: null,
          message: `Error de operación (${error instanceof Error ? error.name : 'error desconocido'}). Consultar content:validate para comprobar la versión seleccionada antes de repetir`,
        };
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `failed-${randomUUID()}.json`);
  const report = reportFor(null, [issue]);
  await writeFile(path, stableJson(report), { flag: 'wx' });
  await writeFile(path.replace(/\.json$/, '.md'), reportMarkdown(report), {
    flag: 'wx',
  });
  return path;
}
