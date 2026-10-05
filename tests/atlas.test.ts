import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadDossierContent } from '../src/content/dossier';
import { buildAtlasData } from '../src/content/atlas-data';
import {
  AtlasIndexSchema,
  EntityDetailFileSchema,
  EventDetailFileSchema,
  SearchIndexSchema,
} from '../src/domain/schema';
import {
  assembleEntity,
  assembleEvent,
  entityAvailability,
  eventAvailability,
  filterEntities,
  filterEvents,
  filterOptions,
  parseFilters,
  sanitizeFilters,
  suggestions,
  timelineContent,
  visibleView,
  writeFilters,
  emptyFilters,
} from '../src/application/atlas';
import { progressSet, choiceFromSnapshot } from '../src/application/progress';
import { normalizeText } from '../src/application/search';
import {
  AtlasLoadError,
  createFetchSource,
} from '../src/application/data-source';
import TimelineExplorer from '../src/components/explorer/TimelineExplorer';
import { parseUrl, buildUrl } from '../src/components/explorer/url-state';

const dataset = await loadDossierContent();
const atlas = buildAtlasData(dataset);
const { index } = atlas;
const at = (milestoneId: string) =>
  visibleView(
    index,
    progressSet({ kind: 'upto', milestoneId }, index.milestones),
  );
const nothing = visibleView(
  index,
  progressSet({ kind: 'none' }, index.milestones),
);
const everything = visibleView(
  index,
  progressSet({ kind: 'all' }, index.milestones),
);

describe('lightweight index and detail files', () => {
  it('produces files that satisfy their schemas and carry no long prose in the index', () => {
    expect(AtlasIndexSchema.safeParse(index).success).toBe(true);
    expect(SearchIndexSchema.safeParse(atlas.search).success).toBe(true);
    for (const detail of atlas.events.values())
      expect(EventDetailFileSchema.safeParse(detail).success).toBe(true);
    for (const detail of atlas.entities.values())
      expect(EntityDetailFileSchema.safeParse(detail).success).toBe(true);
    expect(atlas.events.size).toBe(dataset.events.length);
    expect(atlas.entities.size).toBe(dataset.entities.length);
    const serialized = JSON.stringify(index);
    for (const event of dataset.events)
      expect(serialized).not.toContain(event.body.slice(0, 80));
    // The index is lighter than the prose it keeps out of the first load.
    const prose =
      dataset.events.reduce((sum, event) => sum + event.body.length, 0) +
      dataset.entities.reduce((sum, item) => sum + (item.body?.length ?? 0), 0);
    expect(serialized.length).toBeLessThan(prose);
  });
  it('keeps every fact the first version needs inside the index', () => {
    for (const event of dataset.events) {
      const entry = index.events.find((item) => item.id === event.id)!;
      expect(entry.entityIds).toEqual(event.entityIds);
      expect(entry.spoilerRequirements).toEqual(event.spoilerRequirements);
    }
  });
});

describe('spoiler policy across every surface', () => {
  const hiddenAt = (view: ReturnType<typeof at>) => ({
    events: index.events.filter((event) => !view.eventById.has(event.id)),
    entities: index.entities.filter(
      (entity) => !view.entityById.has(entity.id),
    ),
  });

  it('shows nothing before any progress is declared', () => {
    expect(nothing.events).toHaveLength(0);
    expect(nothing.entities).toHaveLength(0);
    expect(timelineContent(nothing).events).toHaveLength(0);
  });
  it('never leaks hidden titles, names, counts or regions through secondary surfaces', () => {
    for (const milestone of index.milestones.slice(0, -1)) {
      const view = at(milestone.id);
      const { events, entities } = hiddenAt(view);
      expect(events.length).toBeGreaterThan(0);
      const surfaces = JSON.stringify({
        timeline: timelineContent(view),
        options: filterOptions(view),
        events: view.events,
        entities: view.entities,
        relations: view.relations,
      });
      // Names are checked where entities are listed or offered; a visible
      // event's own text (and so its category label) may legitimately mention a person.
      const options = filterOptions(view);
      const listings = JSON.stringify({
        options: { ...options, categories: undefined },
        entities: view.entities,
      });
      for (const event of events) {
        expect(surfaces).not.toContain(event.title);
        expect(surfaces).not.toContain(event.id);
      }
      for (const entity of entities) {
        expect(listings).not.toContain(entity.name);
        expect(surfaces).not.toContain(entity.id);
      }
      // Suggestions and search for a hidden title find nothing.
      for (const event of events) {
        expect(suggestions(view, event.title)).toEqual([]);
        // Results can only be permitted events (a visible text may share words
        // with a hidden title).
        const found = filterEvents(
          view,
          { ...emptyFilters, q: event.title },
          new Map(atlas.search.events.map((item) => [item.id, item.text])),
        );
        expect(found.every((item) => view.eventById.has(item.id))).toBe(true);
      }
      for (const entity of entities) {
        expect(
          filterEntities(
            view,
            entity.kind === 'place' ? 'place' : 'character',
            entity.name,
          ),
        ).toEqual([]);
        expect(eventAvailability(view, events[0]!.id)).toBe('blocked');
        expect(entityAvailability(view, entity.id)).toBe('blocked');
      }
    }
  });
  it('treats a body-text match as a hit only for permitted events', () => {
    const bodies = new Map(
      atlas.search.events.map((item) => [item.id, item.text]),
    );
    // A word that appears only in a late event's text must not surface early.
    const late = dataset.events.find((event) => event.id === 'evt-cataclismo')!;
    const word = normalizeText(late.title)
      .split(' ')
      .find((token) => token.length > 6)!;
    const early = at(index.milestones[0]!.id);
    const results = filterEvents(early, { ...emptyFilters, q: word }, bodies);
    expect(results.every((event) => early.eventById.has(event.id))).toBe(true);
    expect(everything.events.length).toBe(dataset.events.length);
  });
  it('assembles details from visible parts only and keeps relations symmetrical', () => {
    const view = at('hito-mondstadt');
    const visibleId = view.events[0]!.id;
    const detail = assembleEvent(view, atlas.events.get(visibleId)!)!;
    const json = JSON.stringify(detail);
    for (const event of hiddenAt(view).events)
      expect(json).not.toContain(event.title);
    for (const entity of hiddenAt(view).entities)
      expect(detail.entities.map((item) => item.id)).not.toContain(entity.id);
    // Hidden events are not assembled at all.
    const hidden = hiddenAt(view).events[0]!;
    expect(assembleEvent(view, atlas.events.get(hidden.id)!)).toBeNull();
    // Entity ficha lists only visible events.
    const entity = view.entities[0]!;
    const ficha = assembleEntity(view, atlas.entities.get(entity.id)!)!;
    expect(ficha.events.every((event) => view.eventById.has(event.id))).toBe(
      true,
    );
    // Lowering progress removes what was assembled a moment ago.
    expect(assembleEvent(nothing, atlas.events.get(visibleId)!)).toBeNull();
  });
  it('never reveals a time reference to an event the reader cannot see', () => {
    const relative = structuredClone(index);
    const [first, second] = relative.events.filter(
      (event) => event.spoilerRequirements[0] !== 'hito-mondstadt',
    );
    const early = relative.events.find(
      (event) => event.spoilerRequirements[0] === 'hito-mondstadt',
    )!;
    early.time = { kind: 'relative', before: [first!.id], after: [second!.id] };
    const view = visibleView(
      relative,
      progressSet(
        { kind: 'upto', milestoneId: 'hito-mondstadt' },
        relative.milestones,
      ),
    );
    const label = timelineContent(view).events.find(
      (event) => event.id === early.id,
    )!.timeLabel;
    expect(label).not.toContain(first!.title);
    expect(label).toContain('no disponibles');
  });
  it('renders only a neutral shell in the pre-rendered HTML', () => {
    const html = renderToStaticMarkup(createElement(TimelineExplorer, {}));
    for (const event of index.events) expect(html).not.toContain(event.title);
    // «Irmin» is also a prefix of the brand name in the header.
    for (const entity of index.entities)
      expect(html.replaceAll('Irminsul', '')).not.toContain(entity.name);
    expect(html).toContain('Cargando el atlas');
  });
  it('parses stored choices and ignores corrupt values', () => {
    expect(choiceFromSnapshot('{not json')).toBeNull();
    expect(choiceFromSnapshot(null)).toBeNull();
    expect(choiceFromSnapshot('{"kind":"upto"}')).toBeNull();
    expect(choiceFromSnapshot('{"kind":"all"}')).toEqual({ kind: 'all' });
  });
});

describe('search, filters and addresses', () => {
  const bodies = new Map(
    atlas.search.events.map((item) => [item.id, item.text]),
  );
  it('matches names ignoring accents, case and apostrophes, and searches participants', () => {
    expect(normalizeText('Khaenri’ah')).toBe('khaenriah');
    const results = filterEvents(everything, {
      ...emptyFilters,
      q: 'KHAENRIAH',
    });
    expect(results.length).toBeGreaterThan(0);
    const byParticipant = filterEvents(everything, {
      ...emptyFilters,
      q: 'koitar',
    });
    expect(byParticipant.map((event) => event.id)).toContain('evt-hiperborea');
    expect(
      filterEvents(everything, { ...emptyFilters, q: 'zzzzqqq' }, bodies),
    ).toEqual([]);
  });
  it('combines filters, reports incompatible ones, and drops values that do not exist', () => {
    const options = filterOptions(everything);
    expect(options.regions.map((region) => region.name)).toContain('Sumeru');
    expect(options.regions.every((region) => !region.name.includes('/'))).toBe(
      true,
    );
    const combined = filterEvents(everything, {
      ...emptyFilters,
      region: 'Sumeru',
      type: 'minor',
    });
    expect(
      combined.every(
        (event) =>
          event.regions.includes('Sumeru') && event.importance === 'minor',
      ),
    ).toBe(true);
    const incompatible = filterEvents(everything, {
      ...emptyFilters,
      era: 'era-mundo-elemental',
      region: 'Natlan',
    });
    expect(incompatible).toEqual([]);
    const cleaned = sanitizeFilters(
      { ...emptyFilters, era: 'nope', entity: 'per-nope' },
      options,
    );
    expect(cleaned.filters.era).toBe('');
    expect(cleaned.ignored).toEqual(['capítulo', 'personaje o lugar']);
    // Counts are over the permitted set only.
    const early = filterOptions(at('hito-mondstadt'));
    expect(early.eras.reduce((sum, era) => sum + era.count, 0)).toBe(
      at('hito-mondstadt').events.length,
    );
  });
  it('shows the same permitted set on the list and the timeline', () => {
    const filters = { ...emptyFilters, region: 'Liyue' };
    const filtered = filterEvents(everything, filters);
    const content = timelineContent(everything, filtered);
    expect(content.events.map((event) => event.id)).toEqual(
      filtered.map((event) => event.id),
    );
    expect(
      content.relations.every((relation) =>
        content.events.some((event) => event.id === relation.fromEventId),
      ),
    ).toBe(true);
  });
  it('round-trips selection, view and filters through the address', () => {
    const state = parseUrl(
      '?id=evt-remuria&entity=per-x&vista=lista&q=agua&capitulo=era-a&region=Fontaine&con=per-y&faccion=per-f&categoria=Guerras&tipo=principal',
    );
    expect(state).toMatchObject({
      id: 'evt-remuria',
      entity: 'per-x',
      view: 'lista',
    });
    expect(state.filters).toEqual({
      q: 'agua',
      era: 'era-a',
      region: 'Fontaine',
      entity: 'per-y',
      faction: 'per-f',
      category: 'Guerras',
      type: 'major',
    });
    expect(parseUrl(buildUrl(state).slice(1))).toEqual(state);
    expect(
      buildUrl({
        ...state,
        id: '',
        entity: '',
        view: '',
        filters: emptyFilters,
      }),
    ).toBe('/');
    const params = new URLSearchParams('tipo=otro&q=');
    expect(parseFilters(params)).toEqual(emptyFilters);
    writeFilters(params, emptyFilters);
    expect(params.size).toBe(0);
  });
});

describe('data source failures', () => {
  it('reports network failure, HTTP errors and malformed files, and retries after failure', async () => {
    let mode: 'network' | 'status' | 'shape' | 'ok' = 'network';
    const fetcher = (async () => {
      if (mode === 'network') throw new TypeError('offline');
      if (mode === 'status') return new Response('no', { status: 503 });
      if (mode === 'shape') return Response.json({ schemaVersion: 9 });
      return Response.json(index);
    }) as typeof fetch;
    const source = createFetchSource('/data', fetcher);
    await expect(source.index()).rejects.toBeInstanceOf(AtlasLoadError);
    mode = 'status';
    await expect(source.index()).rejects.toThrow('503');
    mode = 'shape';
    await expect(source.index()).rejects.toThrow('no es válido');
    mode = 'ok';
    // Earlier failures were not cached.
    await expect(source.index()).resolves.toMatchObject({ schemaVersion: 1 });
    await expect(source.event('evt-remuria'))
      .resolves.toBeDefined()
      .catch(() => undefined);
  });
  it('offers factions and categories separately from people and places, and filters by them', () => {
    const options = filterOptions(everything);
    expect(options.factions.map((item) => item.id).sort()).toEqual([
      'per-cinco-pecadores',
      'per-primordial',
    ]);
    expect(options.entities.every((item) => item.kind !== 'faction')).toBe(
      true,
    );
    expect(options.categories.length).toBeGreaterThan(3);
    const sinners = filterEvents(everything, {
      ...emptyFilters,
      faction: 'per-cinco-pecadores',
    });
    expect(sinners.length).toBeGreaterThan(0);
    expect(
      sinners.every((event) => event.entityIds.includes('per-cinco-pecadores')),
    ).toBe(true);
    const wars = filterEvents(everything, {
      ...emptyFilters,
      category: 'Guerras y conflictos',
    });
    expect(
      wars.every((event) => event.categories.includes('Guerras y conflictos')),
    ).toBe(true);
    // An unknown address value is dropped and reported, not silently empty.
    const cleaned = sanitizeFilters(
      { ...emptyFilters, faction: 'per-nope', category: 'Nada' },
      options,
    );
    expect(cleaned.ignored).toEqual(['categoría', 'facción']);
    // Options never offer a faction or category the reader cannot see yet.
    const early = filterOptions(at('hito-mondstadt'));
    expect(early.factions).toEqual([]);
  });
});
