/* eslint-disable @typescript-eslint/no-explicit-any -- authoring script over untyped provider JSON */
// N-11/N-12: compiles the reviewed-by-reading chapter summaries written for each
// Archon Quest act (`.validation/arcs/out/<chapter>.json`) into the committed
// corpus `content/editorial/corpora/viajero.json`. Every line reference is
// resolved against the accepted import and pinned by the hash of its text; what
// cannot be resolved is dropped and reported, never repaired.
import console from 'node:console';
import process from 'node:process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { CorpusFileSchema, type CorpusFile } from '../../src/domain/schema.ts';

// Proposed play order (editorial, pending review): provider chapter ids by
// region block, with the provider's own chain for chapters 1302→1306 and
// 1503→1505→1504. `end` marks the chapter that closes a region, which reuses
// the ancient dossier's regional milestone.
const ORDER = [
  1001, 1002, 1003, 1004, 1101, 1102, 1103, 1104, 1201, 1202, 1203, 1204, 1205,
  1206, 1207, 1301, 1302, 1306, 1303, 1304, 1305, 1307, 1308, 1401, 1402, 1403,
  1404, 1405, 1406, 1500, 1501, 1502, 1503, 1505, 1504, 1506, 1600, 1601, 1602,
  1603, 1604, 1605, 1606, 1607, 1608, 1609, 1611, 1700, 1701,
];
const END: Record<number, string> = {
  1003: 'hito-mondstadt',
  1104: 'hito-liyue',
  1206: 'hito-inazuma',
  1308: 'hito-sumeru',
  1406: 'hito-fontaine',
  1506: 'hito-natlan',
};
const BLOCKS: { id: string; name: string; from: number; to: number }[] = [
  { id: 'mondstadt', name: 'Mondstadt', from: 1001, to: 1099 },
  { id: 'liyue', name: 'Liyue', from: 1100, to: 1199 },
  { id: 'inazuma', name: 'Inazuma', from: 1200, to: 1299 },
  { id: 'sumeru', name: 'Sumeru', from: 1300, to: 1399 },
  { id: 'fontaine', name: 'Fontaine', from: 1400, to: 1499 },
  { id: 'natlan', name: 'Natlan', from: 1500, to: 1599 },
  { id: 'nod-krai', name: 'Nod-Krai', from: 1600, to: 1699 },
  { id: 'snezhnaya', name: 'Snezhnaya', from: 1700, to: 1799 },
];
const INTERLUDES = new Set([1004, 1205, 1207, 1307]);

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const store = 'content/imported/animegame';
const pointer = read(`${store}/accepted.json`);
const imported = read(`${store}/versions/${pointer.version}/sources.json`);
const coverage = read('content/editorial/genshin-coverage.json');
const sourceById = new Map<string, any>(
  imported.sources.map((source: any) => [source.id, source]),
);
const segmentById = new Map<string, any>();
for (const source of imported.sources)
  for (const segment of source.segments) segmentById.set(segment.id, segment);
const units = new Map<number, any>(
  coverage.units
    .filter((unit: any) => unit.category === 'archon-quest')
    .map((unit: any) => [unit.providerRef.chapterId, unit]),
);
const existing = new Map<string, string>(
  readFileSync('.validation/arcs/existing-entities.txt', 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split('\t') as [string, string]),
);
const existingEvents = new Set(
  readFileSync('.validation/arcs/existing-events.txt', 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split('\t')[0]!),
);
const warnings: string[] = [];
const warn = (message: string) => warnings.push(message);

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const norm = (value: string) => slug(value).replaceAll('-', ' ');
const clean = (value: string) =>
  // eslint-disable-next-line no-control-regex
  value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
const blockOf = (chapter: number) =>
  BLOCKS.find((block) => chapter >= block.from && chapter <= block.to)!;
const milestoneOf = (chapter: number) => END[chapter] ?? `hito-v-${chapter}`;
const eventId = (chapter: number) => `evt-viajero-${chapter}`;

const outputs = new Map<number, any>();
for (const file of readdirSync('.validation/arcs/out'))
  if (file.endsWith('.json')) {
    const data = read(`.validation/arcs/out/${file}`);
    outputs.set(data.chapterId, data);
  }
const chapters = ORDER.filter((chapter) => outputs.has(chapter));
for (const chapter of ORDER)
  if (!outputs.has(chapter)) warn(`Capítulo sin resumen: ${chapter}`);

// ---- entities ---------------------------------------------------------------
type Entity = {
  id: string;
  kind: 'character' | 'place' | 'faction';
  name: string;
  aliases: Set<string>;
  chapters: number[];
};
const created = new Map<string, Entity>();
const existingByName = new Map(
  [...existing].map(([id, name]) => [norm(name), id]),
);
function resolveEntity(item: any, chapter: number): string | null {
  if (item.existingId) {
    if (!existing.has(item.existingId)) {
      warn(`${chapter}: existingId desconocido ${item.existingId}`);
      return null;
    }
    return item.existingId;
  }
  const name = clean(String(item.name ?? ''));
  if (!name || !['character', 'place', 'faction'].includes(item.kind))
    return null;
  const prefix = item.kind === 'place' ? 'loc' : 'per';
  const id = `${prefix}-${slug(name)}`;
  if (!slug(name)) return null;
  if (existing.has(id)) return id;
  const match = existingByName.get(norm(name));
  if (match) return match;
  const entity: Entity = created.get(id) ?? {
    id,
    kind: item.kind,
    name,
    aliases: new Set<string>(),
    chapters: [],
  };
  for (const alias of item.aliases ?? [])
    if (clean(String(alias)) && clean(String(alias)) !== name)
      entity.aliases.add(clean(String(alias)));
  if (!entity.chapters.includes(chapter)) entity.chapters.push(chapter);
  created.set(id, entity);
  return id;
}

// ---- events, claims, sources --------------------------------------------------
const sources = new Map<string, any>();
const claims: any[] = [];
const events: any[] = [];
const relations: any[] = [];
const refToSegment = (ref: string) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(ref);
  if (!match) return null;
  const id = `agd-quest-${match[1]}-es-talk-${match[2]}-dialog-${match[3]}`;
  return { quest: Number(match[1]), segment: segmentById.get(id) };
};
const sourceFor = (quest: number) => {
  const id = `imp-quest-${quest}`;
  if (!sources.has(id)) {
    const record = sourceById.get(`agd-quest-${quest}-es`);
    sources.set(id, {
      kind: 'imported',
      id,
      importedId: record.id,
      snapshotCommit: imported.snapshot.commit,
      title: `Misión: ${record.title}`,
      sourceKind: 'mission',
      locator: record.locator,
    });
  }
  return id;
};

chapters.forEach((chapter, position) => {
  const out = outputs.get(chapter);
  const unit = units.get(chapter);
  const id = eventId(chapter);
  const milestone = milestoneOf(chapter);
  const block = blockOf(chapter);
  const entityIds = new Set<string>();
  for (const item of out.entities ?? []) {
    const resolved = resolveEntity(item, chapter);
    if (resolved) entityIds.add(resolved);
  }
  // Claims: each line reference becomes a pinned fragment.
  const keyToIds = new Map<string, string>();
  const questsUsed = new Set<number>();
  const seen = new Set<string>();
  for (const claim of out.claims ?? []) {
    const supports: any[] = [];
    for (const ref of claim.refs ?? []) {
      const found = refToSegment(String(ref));
      if (!found?.segment || found.segment.text.status !== 'available') {
        warn(`${chapter}/${claim.key}: referencia sin texto ${ref}`);
        continue;
      }
      questsUsed.add(found.quest);
      supports.push({
        sourceId: sourceFor(found.quest),
        locator: `Diálogo ${String(ref).split('.')[1]}, línea ${String(ref).split('.')[2]}`,
        fragment: {
          segmentId: found.segment.id,
          sha256: found.segment.text.sha256,
        },
        stance: 'supports',
        verification: 'cited',
        limits:
          clean(String(claim.limits ?? 'Sin límites indicados.')) +
          ' Apoyo propuesto por el asistente; sin contraste humano.',
      });
    }
    if (!supports.length && claim.kind !== 'interpretation') {
      warn(
        `${chapter}/${claim.key}: afirmación sin apoyos resolubles; omitida`,
      );
      continue;
    }
    let claimId = `claim-v${chapter}-${slug(String(claim.key)) || 'sin-clave'}`;
    for (let n = 2; seen.has(claimId); n++)
      claimId = `claim-v${chapter}-${slug(String(claim.key))}-${n}`;
    seen.add(claimId);
    keyToIds.set(String(claim.key), claimId);
    claims.push({
      id: claimId,
      eventIds: [id],
      text: clean(String(claim.text)),
      kind: claim.kind,
      support: supports,
      review: { status: 'pending' },
    });
  }
  const evidence = [...questsUsed]
    .sort((a, b) => a - b)
    .map((quest) => ({
      sourceId: sourceFor(quest),
      locator: `Misión ${quest}`,
      claim: 'Diálogos de la misión que sustentan el resumen del acto.',
      stance: 'supports',
      spoilerRequirements: [milestone],
    }));
  const previous = chapters[position - 1];
  events.push({
    id,
    universeId: 'genshin',
    spoilerRequirements: [milestone],
    editorialStatus: 'provisional',
    slug: id,
    language: 'es',
    title: unit.title ?? `Misión de Arconte ${chapter}`,
    aliases: [unit.actLabel].filter(Boolean),
    summary: clean(out.summary),
    body: clean(out.body),
    eraId: `era-viajero-${block.id}`,
    time:
      previous === undefined
        ? { kind: 'unknown', label: 'Sin fecha: orden del relato del juego' }
        : { kind: 'relative', before: [], after: [eventId(previous)] },
    displayOrder: position,
    revelation: { order: position + 1, milestoneIds: [milestone] },
    importance: 'major',
    categories: [...new Set(['Misión de Arconte', ...(out.categories ?? [])])],
    narrativeThread: INTERLUDES.has(chapter)
      ? `${block.name} / Intermedio`
      : block.name,
    certainty: ['documented'],
    entityIds: [...entityIds].sort(),
    evidence,
    claimStatus: 'fact',
  });
  // Mentions of ancient events.
  (out.ancientLinks ?? []).forEach((link: any, n: number) => {
    if (!existingEvents.has(link.eventId)) {
      warn(`${chapter}: enlace a evento antiguo inexistente ${link.eventId}`);
      return;
    }
    relations.push({
      id: `rel-viajero-${chapter}-antiguo-${n + 1}`,
      universeId: 'genshin',
      spoilerRequirements: [],
      editorialStatus: 'provisional',
      fromEventId: id,
      toEventId: link.eventId,
      kind: 'mentions',
      directed: true,
      explanation: clean(String(link.explanation)),
      evidence: [],
      claimStatus: 'fact',
      claimIds: (link.claimKeys ?? [])
        .map((key: string) => keyToIds.get(String(key)))
        .filter(Boolean),
    });
  });
  if (previous !== undefined)
    relations.push({
      id: `rel-viajero-${previous}-${chapter}`,
      universeId: 'genshin',
      spoilerRequirements: [],
      editorialStatus: 'provisional',
      fromEventId: eventId(previous),
      toEventId: id,
      kind: 'association',
      directed: false,
      explanation:
        'Continuidad en el orden de juego propuesto de la Misión de Arconte (no fija fechas ni simultaneidad).',
      evidence: [],
      claimStatus: 'interpretation',
      claimIds: [],
    });
});

// ---- eras, milestones, ladder ---------------------------------------------------
const baseLadder = [
  'hito-mondstadt',
  'hito-liyue',
  'hito-inazuma',
  'hito-sumeru',
  'hito-fontaine',
  'hito-natlan',
];
const ladder = chapters.map(milestoneOf);
const missingBase = baseLadder.filter((id) => !ladder.includes(id));
if (missingBase.length) warn(`Hitos regionales sin capítulo: ${missingBase}`);
const newMilestones = chapters
  .filter((chapter) => !END[chapter])
  .map((chapter) => ({
    id: milestoneOf(chapter),
    universeId: 'genshin',
    safeLabel: String(units.get(chapter).actLabel),
    track: 'main' as const,
    editorialStatus: 'provisional' as const,
  }));
// Duplicate labels (two chapters share "Capítulo III: acto II") stay distinguishable.
const labels = new Map<string, number>();
for (const milestone of newMilestones) {
  const count = (labels.get(milestone.safeLabel) ?? 0) + 1;
  labels.set(milestone.safeLabel, count);
  if (count > 1) milestone.safeLabel += ` (parte ${count})`;
}
const eras = BLOCKS.filter((block) =>
  chapters.some((chapter) => blockOf(chapter) === block),
).map((block, index) => {
  const first = chapters.find((chapter) => blockOf(chapter) === block)!;
  return {
    id: `era-viajero-${block.id}`,
    universeId: 'genshin',
    spoilerRequirements: [milestoneOf(first)],
    editorialStatus: 'provisional' as const,
    name: `Viaje del Viajero · ${block.name}`,
    displayOrder: 100 + index,
    description:
      'Resumen por actos de la Misión de Arconte, en el orden de juego propuesto. No es cronología histórica.',
  };
});

// ---- entities output ------------------------------------------------------------
const entities = [...created.values()].map((entity) => {
  const first = Math.min(...entity.chapters.map((c) => ORDER.indexOf(c)));
  return {
    id: entity.id,
    universeId: 'genshin',
    spoilerRequirements: [milestoneOf(ORDER[first]!)],
    editorialStatus: 'provisional' as const,
    kind: entity.kind,
    name: entity.name,
    aliases: [...entity.aliases].sort(),
  };
});

const corpus: CorpusFile = CorpusFileSchema.parse({
  schemaVersion: 1,
  corpus: 'viajero',
  milestones: newMilestones,
  ladder,
  eras,
  entities,
  events,
  relations,
  evidence: {
    schemaVersion: 1,
    sources: [...sources.values()],
    claims,
  },
});
writeFileSync(
  'content/editorial/corpora/viajero.json',
  JSON.stringify(corpus, null, 2) + '\n',
);
writeFileSync(
  '.validation/arcs/build-warnings.txt',
  warnings.join('\n') + '\n',
);
console.log(
  JSON.stringify({
    events: events.length,
    claims: claims.length,
    sources: sources.size,
    entities: entities.length,
    relations: relations.length,
    warnings: warnings.length,
  }),
);
process.exitCode = 0;
