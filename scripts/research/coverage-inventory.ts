// N-08: rebuilds the coverage inventory from the local, ignored P1 cache.
// It keeps hand-set fields (examination, note, eventIds, sourceIds,
// publication) of units that already exist, and never touches lore content.
import console from 'node:console';
import process from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  CoverageRegistrySchema,
  type CoverageRegistry,
  type CoverageUnit,
} from '../../src/domain/schema.ts';

const cache = '.validation/p1/raw';
const registryPath = 'content/editorial/genshin-coverage.json';
const reportPath = 'docs/validation/n08-inventario-cobertura-2026-10-05.md';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const manifest = read('docs/validation/p1/snapshot-manifest.json');
const selection = read('scripts/import/selection.json');
const chapters: Record<string, unknown>[] = read(
  `${cache}/ExcelBinOutput/ChapterExcelConfigData.json`,
);
const texts: Record<string, string> = {
  ...read(`${cache}/TextMap/TextMapES.json`),
  ...read(`${cache}/TextMap/TextMap_MediumES.json`),
};
const text = (hash: unknown) =>
  typeof hash === 'number' ? (texts[String(hash)] ?? null) : null;
const categories: Record<string, CoverageUnit['category']> = {
  CHAPTER_STYLE_TYPE_AQ: 'archon-quest',
  CHAPTER_STYLE_TYPE_PERSONALLINE: 'character-story',
  CHAPTER_STYLE_TYPE_WORLD_QUEST_RANK_ZERO: 'world-quest',
  CHAPTER_STYLE_TYPE_ACTIVITY_QUEST: 'event-quest',
  CHAPTER_STYLE_TYPE_COOP_QUEST: 'hangout',
  CHAPTER_STYLE_TYPE_TRIBAL: 'tribal',
};
const sampled = new Set<number>(selection.quests);
// Every main quest the provider files under a chapter (the chapter row itself
// only names its last quest).
const mainQuests: { id: number; chapterId?: number }[] = read(
  `${cache}/ExcelBinOutput/MainQuestExcelConfigData.json`,
);
const questsOf = new Map<number, number[]>();
for (const quest of mainQuests)
  if (quest.chapterId !== undefined)
    questsOf.set(quest.chapterId, [
      ...(questsOf.get(quest.chapterId) ?? []),
      quest.id,
    ]);
const previous = new Map<string, CoverageUnit>(
  existsSync(registryPath)
    ? (read(registryPath) as CoverageRegistry).units.map((unit) => [
        unit.id,
        unit,
      ])
    : [],
);
const units: CoverageUnit[] = chapters.map((chapter) => {
  const chapterId = chapter.id as number;
  const mainQuestIds = [
    ...new Set([
      ...((chapter.KMJJJPDPLKE as number[] | undefined) ?? []),
      ...(questsOf.get(chapterId) ?? []),
    ]),
  ].sort((a, b) => a - b);
  const title = text(chapter.chapterTitleTextMapHash);
  const id = `cov-${chapterId}`;
  const fresh: CoverageUnit = {
    id,
    category: categories[chapter.IMFDDPKLIDD as string] ?? 'unclassified',
    arc: text(chapter.chapterImageTitleTextMapHash),
    actLabel: text(chapter.chapterNumTextMapHash),
    title,
    providerRef: { chapterId, mainQuestIds },
    publication: null,
    spanish: title ? 'available' : 'title-missing',
    importStatus: mainQuestIds.some((quest) => sampled.has(quest))
      ? 'sampled'
      : 'not-imported',
    examination: 'not-examined',
    sourceIds: [],
    eventIds: [],
  };
  const kept = previous.get(id);
  return kept
    ? {
        ...fresh,
        publication: kept.publication,
        importStatus: kept.importStatus,
        examination: kept.examination,
        sourceIds: kept.sourceIds,
        eventIds: kept.eventIds,
        ...(kept.note ? { note: kept.note } : {}),
      }
    : fresh;
});
units.sort((a, b) => a.providerRef.chapterId - b.providerRef.chapterId);
const existing = existsSync(registryPath)
  ? (read(registryPath) as CoverageRegistry)
  : null;
const registry = CoverageRegistrySchema.parse({
  schemaVersion: 1,
  snapshot: {
    commit: manifest.commit,
    providerBuild: manifest.providerDeclaredBuild.value,
    commitDate: manifest.commitDate,
  },
  publicCutoff: existing?.publicCutoff ?? {
    version: '7.1',
    date: '2026-09-23',
    verification: 'unverified',
    reference: 'pendiente',
    note: 'Sin comprobar',
  },
  units,
});
writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

const rows = new Map<string, CoverageUnit[]>();
for (const unit of units)
  rows.set(unit.category, [...(rows.get(unit.category) ?? []), unit]);
const count = (list: CoverageUnit[], pick: (u: CoverageUnit) => boolean) =>
  list.filter(pick).length;
const lines = [
  '# N-08 — Inventario de cobertura (2026-10-05)',
  '',
  'Generado por `npm run content:coverage` desde `content/editorial/genshin-coverage.json`. **Es un inventario de lo que existe en el snapshot técnico, no de lo que está examinado ni aprobado.**',
  '',
  '## Corte',
  '',
  `- Snapshot técnico: \`${registry.snapshot.commit}\` (${registry.snapshot.commitDate}), build declarada \`${registry.snapshot.providerBuild}\`.`,
  `- Corte público declarado: versión ${registry.publicCutoff.version}, ${registry.publicCutoff.date}. Verificación: **${registry.publicCutoff.verification}**. ${registry.publicCutoff.note}`,
  '',
  '## Denominador y numerador por categoría',
  '',
  '| Categoría | Unidades | Con título en español | Importadas parcialmente | Examinadas | Con eventos | Con fecha/versión de publicación |',
  '|---|---:|---:|---:|---:|---:|---:|',
];
for (const [category, list] of rows)
  lines.push(
    `| ${category} | ${list.length} | ${count(list, (u) => u.spanish === 'available')} | ${count(list, (u) => u.importStatus !== 'not-imported')} | ${count(list, (u) => u.examination !== 'not-examined')} | ${count(list, (u) => u.examination === 'examined-with-events')} | ${count(list, (u) => u.publication !== null)} |`,
  );
lines.push(
  `| **Total** | ${units.length} | ${count(units, (u) => u.spanish === 'available')} | ${count(units, (u) => u.importStatus !== 'not-imported')} | ${count(units, (u) => u.examination !== 'not-examined')} | ${count(units, (u) => u.examination === 'examined-with-events')} | ${count(units, (u) => u.publication !== null)} |`,
  '',
  '## Misiones de Archonte (actos y capítulos)',
  '',
  '| ID | Arco | Acto | Título | Español | Importación | Examen |',
  '|---|---|---|---|---|---|---|',
);
for (const unit of rows.get('archon-quest') ?? [])
  lines.push(
    `| ${unit.id} | ${unit.arc ?? '—'} | ${unit.actLabel ?? '—'} | ${unit.title ?? '—'} | ${unit.spanish} | ${unit.importStatus} | ${unit.examination} |`,
  );
lines.push(
  '',
  '## Límites',
  '',
  '- Una unidad es un capítulo del registro del proveedor (`ChapterExcelConfigData`); no equivale a un evento histórico ni a una fuente.',
  '- «Con título en español» solo indica que el título existe en el TextMap en español; un hueco no significa que el contenido no exista.',
  '- Versión y fecha de publicación por unidad: ninguna acreditada (el snapshot no las contiene); queda `null`.',
  '- Las unidades sin categoría reconocida se cuentan como `unclassified`; no se han evaluado.',
  '',
);
writeFileSync(reportPath, lines.join('\n'));
console.log(
  JSON.stringify({
    units: units.length,
    categories: Object.fromEntries([...rows].map(([k, v]) => [k, v.length])),
  }),
);
process.exitCode = 0;
