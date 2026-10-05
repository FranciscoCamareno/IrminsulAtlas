import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import {
  DatasetSchema,
  DossierMapSchema,
  RevelationMapSchema,
  type Dataset,
  type Evidence,
  type RevelationMap,
} from '../domain/schema';
import { findIntegrityIssues } from '../domain/integrity';

export const dossierFiles = [
  {
    id: 'guia',
    file: '00_guia_de_lectura.md',
    title: 'Guía de lectura y alcance',
  },
  {
    id: 'historia',
    file: '01_historia_cronologica.md',
    title: 'Historia de Teyvat',
  },
  {
    id: 'lugares',
    file: '02_regiones_y_locaciones.md',
    title: 'Regiones y lugares',
  },
  {
    id: 'personajes',
    file: '03_personajes_fundamentales.md',
    title: 'Personajes fundamentales',
  },
] as const;

export async function loadDossierDocuments() {
  return Promise.all(
    dossierFiles.map(async (document) => ({
      ...document,
      body: (await readFile(resolve('docs', document.file), 'utf8'))
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/^---\n[\s\S]*?\n---\n/, '')
        .trim(),
    })),
  );
}

// Only the supplied, non-executable Markdown subset is read. A heading without
// an ID also ends a section, so exclusions never bleed into the previous card.
export function extractDossierSections(body: string) {
  const lines = body.split('\n');
  const sections: Array<{ id: string; title: string; body: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const heading = lines[i]!.match(
      /^#{2,3}\s+(.+?)\s+—\s+`((?:evt|loc|per)-[a-z0-9-]+)`\s*$/,
    );
    if (!heading) continue;
    let end = i + 1;
    while (end < lines.length && !/^#{1,6} /.test(lines[end]!)) end++;
    sections.push({
      id: heading[2]!,
      title: heading[1]!.replace(/^\d+\.\s*/, ''),
      body: lines
        .slice(i + 1, end)
        .join('\n')
        .trim(),
    });
  }
  // Supplementary people use stable IDs in tables rather than headings.
  for (const line of lines) {
    if (!line.startsWith('|') || !/`per-[a-z0-9-]+`/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const id = cells[0]?.match(/`(per-[a-z0-9-]+)`/)?.[1];
    if (!id) continue;
    const idOnly = cells[0] === '`' + id + '`';
    const title = idOnly
      ? cells[1]!
      : cells[0]!.replace(/\s*—\s*`per-[a-z0-9-]+`/, '');
    const prose = idOnly ? cells[2]! : cells[1]!;
    const sources = idOnly
      ? sections
          .find((section) => section.id === 'per-cinco-pecadores')
          ?.body.match(/Fuentes:[\s\S]*$/)?.[0]
      : cells[2];
    sections.push({
      id,
      title,
      body:
        prose +
        (sources ? '\n\n' + (idOnly ? sources : 'Fuentes: ' + sources) : ''),
    });
  }
  const seen = new Set<string>();
  for (const section of sections) {
    if (seen.has(section.id))
      throw new Error('ID repetido en el dossier: ' + section.id);
    seen.add(section.id);
  }
  return sections;
}

async function loadRevelationMap() {
  return RevelationMapSchema.parse(
    JSON.parse(
      await readFile(
        resolve('content/editorial/genshin-revelation.json'),
        'utf8',
      ),
    ),
  );
}

// Requirements come only from the editorial revelation map. An event without an
// assignment is a loading error: unclassified content must never default to visible.
function applyRevelation(data: Dataset, map: RevelationMap) {
  const rank = new Map(map.milestones.map((item, index) => [item.id, index]));
  const known = new Set(data.events.map((event) => event.id));
  for (const id of Object.keys(map.events))
    if (!known.has(id))
      throw new Error('Revelación de evento inexistente: ' + id);
  const latest = (ids: readonly string[]) =>
    ids.reduce((a, b) => (rank.get(b)! > rank.get(a)! ? b : a));
  const assigned = (id: string) => {
    const milestone = map.events[id];
    if (!milestone || !rank.has(milestone))
      throw new Error('Evento sin hito de revelación válido: ' + id);
    return milestone;
  };
  data.milestones = map.milestones.map((item) => ({
    universeId: 'genshin',
    editorialStatus: map.status === 'reviewed' ? 'reviewed' : 'provisional',
    ...item,
  }));
  for (const event of data.events) {
    const milestone = assigned(event.id);
    event.spoilerRequirements = [milestone];
    event.revelation = {
      order: rank.get(milestone)! + 1,
      milestoneIds: [milestone],
    };
  }
  for (const entity of data.entities) {
    const linked = data.events
      .filter((event) => event.entityIds.includes(entity.id))
      .map((event) => event.spoilerRequirements[0]!);
    // A complementary event is the very text of its place/person section, so
    // the entity opens together with that event, never later.
    const home = data.events.find(
      (event) => event.dossierSection === entity.id,
    );
    const milestone =
      map.entityOverrides[entity.id] ??
      home?.spoilerRequirements[0] ??
      (linked.length ? latest(linked) : map.unlinkedEntityMilestone);
    if (!rank.has(milestone))
      throw new Error('Hito de ficha inexistente: ' + milestone);
    entity.spoilerRequirements = [milestone];
  }
}

const scope = {
  universeId: 'genshin',
  spoilerRequirements: [],
  editorialStatus: 'provisional' as const,
};

export async function loadDossierContent(): Promise<Dataset> {
  const documents = await loadDossierDocuments();
  const mapping = DossierMapSchema.parse(
    JSON.parse(
      await readFile(resolve('content/editorial/genshin-dossier.json'), 'utf8'),
    ),
  );
  const sections = documents.flatMap((document) =>
    extractDossierSections(document.body).map((section) => ({
      ...section,
      document,
    })),
  );
  const byId = new Map(sections.map((section) => [section.id, section]));
  if (byId.size !== sections.length)
    throw new Error('IDs repetidos entre documentos del dossier');
  const required = (id: string) => {
    const section = byId.get(id);
    if (!section) throw new Error('Apartado de dossier inexistente: ' + id);
    return section;
  };
  const data: Dataset = {
    schemaVersion: 1,
    universes: [
      {
        id: 'genshin',
        name: 'Genshin Impact · Dossier de historia antigua',
        defaultLanguage: 'es',
        editorialStatus: 'provisional',
        temporalSystems: [
          {
            id: 'teyvat-presente-narrativo',
            label: 'Años respecto al presente narrativo',
            convention:
              'Valores negativos: años anteriores al presente del juego. No son fechas terrestres.',
          },
        ],
      },
    ],
    eras: mapping.eras.map((era, displayOrder) => ({
      ...scope,
      ...era,
      displayOrder,
    })),
    entities: sections
      .filter((section) => /^(per|loc)-/.test(section.id))
      .map((section) => ({
        ...scope,
        id: section.id,
        kind: section.id.startsWith('per-')
          ? ('character' as const)
          : ('place' as const),
        name: section.title,
        aliases: [],
        body: section.body,
        dossierSection: section.id,
      })),
    milestones: [],
    events: [],
    relations: [],
    sources: [],
  };
  const sourceIds = new Set<string>();
  function evidenceFor(sectionId: string): Evidence[] {
    const section = required(sectionId);
    const localId = 'source-dossier-' + section.document.id;
    if (!sourceIds.has(localId)) {
      sourceIds.add(localId);
      data.sources.push({
        ...scope,
        id: localId,
        kind: 'document',
        title: section.document.title,
        language: 'es',
        locator: 'docs/' + section.document.file,
        work: 'Dossier aportado por el usuario · primer borrador',
      });
    }
    const evidence: Evidence[] = [
      {
        sourceId: localId,
        locator: 'docs/' + section.document.file + '#' + section.id,
        claim: 'Texto del apartado suministrado, conservado en esta ficha.',
        stance: 'supports',
        spoilerRequirements: [],
        note: 'Traslado fiel del dossier; contraste externo pendiente.',
      },
    ];
    const seen = new Set<string>();
    for (const link of section.body.matchAll(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    )) {
      const url = link[2]!;
      if (seen.has(url)) continue;
      seen.add(url);
      const id =
        'source-ref-' +
        createHash('sha256').update(url).digest('hex').slice(0, 20);
      if (!sourceIds.has(id)) {
        sourceIds.add(id);
        data.sources.push({
          ...scope,
          id,
          kind: 'document',
          title: link[1]!,
          language: 'und',
          locator: 'Referencia enlazada en ' + section.document.file,
          url,
          work: 'Referencia del dossier; contenido externo sin contrastar en esta integración',
        });
      }
      evidence.push({
        sourceId: id,
        locator: section.id,
        claim: 'Referencia conservada tal como aparece en el apartado.',
        stance: 'supports',
        spoilerRequirements: [],
        note: 'No se ha verificado de nuevo su contenido ni disponibilidad.',
      });
    }
    return evidence;
  }
  for (const [displayOrder, annotation] of mapping.events.entries()) {
    const section = required(annotation.sectionId);
    const { sectionId, ...fields } = annotation;
    data.events.push({
      ...scope,
      ...fields,
      title: annotation.title ?? section.title,
      slug: annotation.id,
      language: 'es',
      aliases: [],
      summary: section.body.split('\n\n')[0]!,
      body: section.body,
      displayOrder,
      revelation: { order: 0, milestoneIds: [] },
      categories: [
        annotation.eraId === 'era-cierre-cataclismo'
          ? 'Cierre contextual'
          : 'Historia antigua',
      ],
      dossierSection: sectionId,
      evidence: evidenceFor(sectionId),
      claimStatus: 'interpretation',
    });
  }
  for (const relation of mapping.relations) {
    const { sectionId, ...fields } = relation;
    data.relations.push({
      ...scope,
      ...fields,
      directed: ['precedes', 'causes', 'mentions'].includes(relation.kind),
      claimStatus: 'interpretation',
      evidence: evidenceFor(sectionId),
    });
  }
  const mappedIds = new Set(mapping.events.map((event) => event.id));
  for (const section of sections.filter((section) =>
    section.id.startsWith('evt-'),
  )) {
    if (!mappedIds.has(section.id))
      throw new Error('Acontecimiento sin anotaciones: ' + section.id);
  }
  applyRevelation(data, await loadRevelationMap());
  const parsed = DatasetSchema.parse(data);
  const issues = findIntegrityIssues(parsed);
  if (issues.length)
    throw new Error(
      issues.map((issue) => issue.path + ': ' + issue.message).join('\n'),
    );
  return parsed;
}
