import type {
  AtlasIndex,
  EntityDetailFile,
  EventDetailFile,
  IndexEvent,
} from '../domain/schema';
import {
  isVisible,
  meetsRequirements,
  type Progress,
} from '../domain/visibility';
import {
  formatTime,
  type EventDetail,
  type EventSummary,
  type TimelineContent,
} from './catalog';
import { matchesTokens, normalizeText, queryTokens } from './search';

// Everything here works on the lightweight index. Visibility is decided first;
// search, filters, counts and suggestions only ever see what survives it.
export interface VisibleView {
  index: AtlasIndex;
  progress: Progress;
  eras: AtlasIndex['eras'];
  events: IndexEvent[];
  entities: AtlasIndex['entities'];
  relations: AtlasIndex['relations'];
  eventById: Map<string, IndexEvent>;
  entityById: Map<string, AtlasIndex['entities'][number]>;
}

export function visibleView(
  index: AtlasIndex,
  progress: Progress,
): VisibleView {
  const eras = index.eras.filter((era) => isVisible(era, progress));
  const eraIds = new Set(eras.map((era) => era.id));
  const eraOrder = new Map(index.eras.map((era) => [era.id, era.displayOrder]));
  const permitted = index.events.filter(
    (event) => eraIds.has(event.eraId) && isVisible(event, progress),
  );
  const eventIds = new Set(permitted.map((event) => event.id));
  const entities = index.entities.filter((entity) =>
    isVisible(entity, progress),
  );
  const entityIds = new Set(entities.map((entity) => entity.id));
  // Defense in depth: references to hidden content are removed from the view
  // itself, so no consumer can echo the ID of something the reader cannot see.
  const events = permitted
    .map((event) => ({
      ...event,
      entityIds: event.entityIds.filter((id) => entityIds.has(id)),
      time:
        event.time.kind === 'relative'
          ? {
              ...event.time,
              before: event.time.before.filter((id) => eventIds.has(id)),
              after: event.time.after.filter((id) => eventIds.has(id)),
            }
          : event.time,
    }))
    .sort(
      (a, b) =>
        (eraOrder.get(a.eraId) ?? 0) - (eraOrder.get(b.eraId) ?? 0) ||
        a.displayOrder - b.displayOrder ||
        a.id.localeCompare(b.id),
    );
  const eventById = new Map(events.map((event) => [event.id, event]));
  const relations = index.relations.filter(
    (relation) =>
      isVisible(relation, progress) &&
      eventById.has(relation.fromEventId) &&
      eventById.has(relation.toEventId),
  );
  return {
    index,
    progress,
    eras,
    events,
    entities,
    relations,
    eventById,
    entityById: new Map(entities.map((entity) => [entity.id, entity])),
  };
}

export type Availability = 'visible' | 'blocked' | 'not-found';
export function eventAvailability(view: VisibleView, id: string): Availability {
  if (view.eventById.has(id)) return 'visible';
  return view.index.events.some((event) => event.id === id)
    ? 'blocked'
    : 'not-found';
}
export function entityAvailability(
  view: VisibleView,
  id: string,
): Availability {
  if (view.entityById.has(id)) return 'visible';
  return view.index.entities.some((entity) => entity.id === id)
    ? 'blocked'
    : 'not-found';
}

function visibleTitle(view: VisibleView) {
  return (id: string) => view.eventById.get(id)?.title;
}
function summarize(
  view: VisibleView,
  event: IndexEvent,
): Omit<EventSummary, 'summary'> {
  const era = view.index.eras.find((item) => item.id === event.eraId);
  return {
    id: event.id,
    narrativeThread: event.narrativeThread,
    dossierSection: event.dossierSection,
    certainty: event.certainty,
    categories: event.categories,
    eraId: event.eraId,
    title: event.title,
    eraName: era?.name ?? '',
    timeLabel: formatTime(event.time, visibleTitle(view)),
    importance: event.importance,
    claimStatus: event.claimStatus,
    editorialStatus: event.editorialStatus,
  };
}

export function timelineContent(
  view: VisibleView,
  events: readonly IndexEvent[] = view.events,
): TimelineContent {
  const ids = new Set(events.map((event) => event.id));
  return {
    events: events.map((event) => summarize(view, event)),
    eras: view.eras
      .filter((era) => events.some((event) => event.eraId === era.id))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((era) => ({
        id: era.id,
        name: era.name,
        description: era.description,
      })),
    relations: view.relations
      .filter(
        (relation) =>
          ids.has(relation.fromEventId) && ids.has(relation.toEventId),
      )
      .map((relation) => ({
        id: relation.id,
        fromEventId: relation.fromEventId,
        toEventId: relation.toEventId,
        directed: relation.directed,
        kind: relation.kind,
        claimStatus: relation.claimStatus,
      })),
  };
}

export function assembleEvent(
  view: VisibleView,
  file: EventDetailFile,
): EventDetail | null {
  const event = view.eventById.get(file.id);
  if (!event) return null;
  const evidence = (items: EventDetailFile['evidence']) =>
    items
      .filter((item) =>
        meetsRequirements(item.spoilerRequirements, view.progress),
      )
      .map((item) => ({
        sourceId: item.sourceId,
        sourceTitle: item.sourceTitle,
        locator: item.locator,
        claim: item.claim,
        stance: item.stance,
        note: item.note,
        sourceUrl: item.sourceUrl,
        availability: item.availability,
      }));
  const summaries = (id: string) => {
    const other = view.eventById.get(id)!;
    return { ...summarize(view, other), summary: '' };
  };
  const explanations = new Map(file.relations.map((item) => [item.id, item]));
  return {
    ...summarize(view, event),
    summary: file.summary,
    body: file.body,
    entities: event.entityIds.flatMap((id) => {
      const entity = view.entityById.get(id);
      return entity ? [{ id, name: entity.name, kind: entity.kind }] : [];
    }),
    evidence: evidence(file.evidence),
    claims: file.claims.filter((claim) =>
      meetsRequirements(claim.spoilerRequirements, view.progress),
    ),
    relations: view.relations
      .filter(
        (relation) =>
          (relation.fromEventId === event.id ||
            relation.toEventId === event.id) &&
          explanations.has(relation.id),
      )
      .map((relation) => ({
        id: relation.id,
        kind: relation.kind,
        directed: relation.directed,
        from: summaries(relation.fromEventId),
        to: summaries(relation.toEventId),
        explanation: explanations.get(relation.id)!.explanation,
        claimStatus: relation.claimStatus,
        evidence: evidence(explanations.get(relation.id)!.evidence),
      })),
  };
}

export function assembleEntity(view: VisibleView, file: EntityDetailFile) {
  const entity = view.entityById.get(file.id);
  if (!entity) return null;
  return {
    entity: {
      ...entity,
      ...(file.body ? { body: file.body } : {}),
    },
    events: view.events
      .filter((event) => event.entityIds.includes(entity.id))
      .map((event) => ({ id: event.id, title: event.title })),
  };
}

// ---- Search and filters -------------------------------------------------

export interface AtlasFilters {
  q: string;
  era: string;
  region: string;
  entity: string;
  faction: string;
  category: string;
  type: '' | 'major' | 'minor';
}
export const emptyFilters: AtlasFilters = {
  q: '',
  era: '',
  region: '',
  entity: '',
  faction: '',
  category: '',
  type: '',
};
const typeParam = { major: 'principal', minor: 'secundario' } as const;

export function parseFilters(params: URLSearchParams): AtlasFilters {
  const type = params.get('tipo');
  return {
    q: params.get('q') ?? '',
    era: params.get('capitulo') ?? '',
    region: params.get('region') ?? '',
    entity: params.get('con') ?? '',
    faction: params.get('faccion') ?? '',
    category: params.get('categoria') ?? '',
    type:
      type === typeParam.major
        ? 'major'
        : type === typeParam.minor
          ? 'minor'
          : '',
  };
}
export function writeFilters(params: URLSearchParams, filters: AtlasFilters) {
  const set = (key: string, value: string) =>
    value ? params.set(key, value) : params.delete(key);
  set('q', filters.q);
  set('capitulo', filters.era);
  set('region', filters.region);
  set('con', filters.entity);
  set('faccion', filters.faction);
  set('categoria', filters.category);
  set('tipo', filters.type ? typeParam[filters.type] : '');
}
export const hasFilters = (filters: AtlasFilters) =>
  Object.values(filters).some(Boolean);

export const regionsOf = (event: IndexEvent) => event.regions;

export function filterOptions(view: VisibleView) {
  const count = <T>(items: T[], key: (item: T) => string[]) => {
    const totals = new Map<string, number>();
    for (const item of items)
      for (const value of key(item))
        totals.set(value, (totals.get(value) ?? 0) + 1);
    return totals;
  };
  const regions = count(view.events, regionsOf);
  const participants = count(view.events, (event) =>
    event.entityIds.filter((id) => view.entityById.has(id)),
  );
  const eras = count(view.events, (event) => [event.eraId]);
  const categories = count(view.events, (event) => event.categories);
  const entityList = [...participants].map(([id, total]) => ({
    id,
    name: view.entityById.get(id)!.name,
    kind: view.entityById.get(id)!.kind,
    count: total,
  }));
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, 'es');
  return {
    eras: view.eras
      .filter((era) => eras.has(era.id))
      .map((era) => ({ id: era.id, name: era.name, count: eras.get(era.id)! })),
    regions: [...regions]
      .map(([name, total]) => ({ name, count: total }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    // People and places, and factions, are offered under separate filters.
    entities: entityList.filter((item) => item.kind !== 'faction').sort(byName),
    factions: entityList.filter((item) => item.kind === 'faction').sort(byName),
    categories: [...categories]
      .map(([name, total]) => ({ name, count: total }))
      .sort(byName),
    types: {
      major: view.events.filter((event) => event.importance === 'major').length,
      minor: view.events.filter((event) => event.importance === 'minor').length,
    },
  };
}
export type FilterOptions = ReturnType<typeof filterOptions>;

// A filter value that does not exist among the permitted options is dropped
// (and reported) rather than silently producing an empty or misleading list.
export function sanitizeFilters(filters: AtlasFilters, options: FilterOptions) {
  const ignored: string[] = [];
  const next = { ...filters };
  if (next.era && !options.eras.some((item) => item.id === next.era)) {
    ignored.push('capítulo');
    next.era = '';
  }
  if (
    next.region &&
    !options.regions.some((item) => item.name === next.region)
  ) {
    ignored.push('región');
    next.region = '';
  }
  if (
    next.category &&
    !options.categories.some((item) => item.name === next.category)
  ) {
    ignored.push('categoría');
    next.category = '';
  }
  if (
    next.faction &&
    !options.factions.some((item) => item.id === next.faction)
  ) {
    ignored.push('facción');
    next.faction = '';
  }
  if (
    next.entity &&
    !options.entities.some((item) => item.id === next.entity)
  ) {
    ignored.push('personaje o lugar');
    next.entity = '';
  }
  return { filters: next, ignored };
}

function metadataText(view: VisibleView, event: IndexEvent): string {
  const era = view.index.eras.find((item) => item.id === event.eraId);
  return normalizeText(
    [
      event.title,
      ...event.aliases,
      era?.name ?? '',
      ...event.regions,
      ...event.categories,
      ...event.entityIds.flatMap((id) => {
        const entity = view.entityById.get(id);
        return entity ? [entity.name, ...entity.aliases] : [];
      }),
    ].join(' '),
  );
}

// `bodies` is the lazily loaded full-text index; metadata search works without it.
export function filterEvents(
  view: VisibleView,
  filters: AtlasFilters,
  bodies?: ReadonlyMap<string, string>,
): IndexEvent[] {
  const tokens = queryTokens(filters.q);
  return view.events.filter((event) => {
    if (filters.era && event.eraId !== filters.era) return false;
    if (filters.region && !event.regions.includes(filters.region)) return false;
    if (filters.faction && !event.entityIds.includes(filters.faction))
      return false;
    if (filters.category && !event.categories.includes(filters.category))
      return false;
    if (filters.entity && !event.entityIds.includes(filters.entity))
      return false;
    if (filters.type && event.importance !== filters.type) return false;
    if (!tokens.length) return true;
    const text =
      metadataText(view, event) + ' ' + (bodies?.get(event.id) ?? '');
    return matchesTokens(text, tokens);
  });
}

// Suggestions are drawn only from permitted titles and entity names.
export function suggestions(view: VisibleView, query: string, limit = 6) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  const events = view.events
    .filter((event) => matchesTokens(normalizeText(event.title), tokens))
    .map((event) => ({
      kind: 'event' as const,
      id: event.id,
      label: event.title,
    }));
  const entities = view.entities
    .filter((entity) =>
      matchesTokens(
        normalizeText([entity.name, ...entity.aliases].join(' ')),
        tokens,
      ),
    )
    .map((entity) => ({
      kind: 'entity' as const,
      id: entity.id,
      label: entity.name,
    }));
  return [...events, ...entities].slice(0, limit);
}

export function filterEntities(
  view: VisibleView,
  kind: 'character' | 'place',
  query: string,
  bodies?: ReadonlyMap<string, string>,
) {
  const tokens = queryTokens(query);
  return view.entities.filter(
    (entity) =>
      entity.kind === kind &&
      matchesTokens(
        normalizeText([entity.name, ...entity.aliases].join(' ')) +
          ' ' +
          (bodies?.get(entity.id) ?? ''),
        tokens,
      ),
  );
}
