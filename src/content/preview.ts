import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dataset, ImportedDataset, SourceRecord } from '../domain/schema';
import { loadLocalContent } from './local';

// Temporary visual preview requested by the user. Set false to restore the demo.
// These UI projections are not editorial events and never modify P2's sources.
export const lorePreviewEnabled = true;

export async function loadSiteContent(): Promise<Dataset> {
  if (!lorePreviewEnabled) return loadLocalContent();
  const root = resolve('content/imported/animegame');
  const accepted = JSON.parse(
    await readFile(resolve(root, 'accepted.json'), 'utf8'),
  ) as { version: string };
  const imported = JSON.parse(
    await readFile(
      resolve(root, 'versions', accepted.version, 'sources.json'),
      'utf8',
    ),
  ) as ImportedDataset;
  const universeId = 'genshin-preview';
  const groups = [
    'Misiones y conversaciones',
    'Historias de personajes',
    'Armas y artefactos',
    'Libros y documentos',
  ];
  const group = (source: SourceRecord) =>
    source.kind === 'mission' || source.kind === 'ambient-dialogue'
      ? 0
      : source.kind === 'character-story'
        ? 1
        : source.kind === 'weapon-story' || source.kind === 'artifact-story'
          ? 2
          : 3;
  const bookOrder = (source: SourceRecord) =>
    (source.context as { catalog?: { sortOrder?: number }[] }).catalog?.[0]
      ?.sortOrder ?? 0;
  const sources = [...imported.sources].sort(
    (a, b) => group(a) - group(b) || bookOrder(a) - bookOrder(b),
  );
  const scope = {
    universeId,
    spoilerRequirements: [],
    editorialStatus: 'demo' as const,
  };
  const data: Dataset = {
    schemaVersion: 1,
    universes: [
      {
        id: universeId,
        name: 'Genshin Impact · Vista previa',
        defaultLanguage: 'es',
        temporalSystems: [
          {
            id: 'preview-order',
            label: 'Distribución provisional',
            convention:
              'Los grupos y posiciones solo prueban la composición; no representan fechas.',
          },
        ],
        editorialStatus: 'demo',
      },
    ],
    eras: groups.map((name, index) => ({
      ...scope,
      id: `preview-group-${index}`,
      name,
      displayOrder: index,
    })),
    entities: [],
    milestones: [],
    sources: [],
    events: [],
    relations: [],
  };
  for (const [index, source] of sources.entries()) {
    const id = `preview-${source.id}`;
    const segment =
      source.segments.find(
        (segment) =>
          segment.text.status === 'available' && segment.text.value.length > 80,
      ) ?? source.segments[0]!;
    const original =
      segment.text.status === 'available' ? segment.text.value : '';
    // Strip presentation tags as plain text; never render imported HTML.
    const body = original
      .replace(/<[^>]*>/g, '')
      .replace(/^#/, '')
      .trim();
    const excerpt =
      body.length > 900 ? body.slice(0, 900).trimEnd() + '…' : body;
    const title =
      source.id === 'agd-fetter-10202-es'
        ? `Amber · ${source.title}`
        : source.title;
    const sourceId = `preview-source-${source.id}`;
    const entityIds: string[] = [];
    for (const speaker of source.segments
      .map((segment) => segment.speaker)
      .filter(
        (speaker) => speaker.name && /^\d+$/.test(speaker.externalId ?? ''),
      )) {
      const entityId = `preview-character-${speaker.externalId}`;
      if (!data.entities.some((entity) => entity.id === entityId))
        data.entities.push({
          ...scope,
          id: entityId,
          kind: 'character',
          name: speaker.name!,
          aliases: [],
        });
      if (!entityIds.includes(entityId)) entityIds.push(entityId);
    }
    data.sources.push({
      ...scope,
      id: sourceId,
      kind: 'document',
      title: source.title,
      language: 'es',
      locator: `${segment.locator.path}#${segment.locator.pointer}`,
      work: 'Genshin Impact',
      url: `${imported.snapshot.repository}/blob/${imported.snapshot.commit}/${segment.locator.path}`,
    });
    data.events.push({
      ...scope,
      id,
      slug: id,
      language: 'es',
      title,
      aliases: [],
      summary: 'Fragmento de fuente · vista previa visual',
      body: excerpt,
      eraId: `preview-group-${group(source)}`,
      time: { kind: 'unknown', label: 'Sin ubicación temporal asignada' },
      displayOrder: index,
      revelation: { order: index, milestoneIds: [] },
      importance: index % 3 === 2 ? 'minor' : 'major',
      categories: [source.kind],
      entityIds,
      evidence: [
        {
          sourceId,
          locator: `Segmento ${segment.externalId}`,
          claim: 'Texto de origen utilizado para esta vista previa.',
          stance: 'supports',
          spoilerRequirements: [],
          note: 'El nodo representa material fuente, no un acontecimiento histórico aprobado.',
        },
      ],
      claimStatus: 'interpretation',
    });
  }
  // Deliberately illustrative links: no temporal or causal claim is inferred.
  const connect = (from: number, to: number) => {
    const a = data.events[from];
    const b = data.events[to];
    if (!a || !b) return;
    data.relations.push({
      ...scope,
      id: `preview-link-${from}-${to}`,
      fromEventId: a.id,
      toEventId: b.id,
      kind: 'association',
      directed: false,
      explanation:
        'Conexión de muestra para probar el diseño; no afirma una relación de lore.',
      evidence: [],
      claimStatus: 'interpretation',
    });
  };
  for (let index = 1; index < data.events.length; index++)
    connect(index - 1, index);
  for (const [from, to] of [
    [0, 3],
    [1, 4],
    [3, 6],
    [4, 9],
    [6, 11],
    [8, 13],
    [11, 15],
    [13, 18],
  ])
    connect(from!, to!);
  return data;
}
