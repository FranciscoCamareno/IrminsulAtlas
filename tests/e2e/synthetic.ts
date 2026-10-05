import type { AtlasIndex, EventDetailFile } from '../../src/domain/schema';

// SYNTHETIC dense data set for load limits: every title says so, none of it is
// lore. It is served in place of the real files by the performance tests only.
export function densify(
  index: AtlasIndex,
  details: (id: string) => Promise<EventDetailFile>,
  copies: number,
) {
  const events: AtlasIndex['events'] = [];
  const relations: AtlasIndex['relations'] = [];
  for (let copy = 0; copy < copies; copy++) {
    for (const event of index.events) {
      events.push({
        ...event,
        id: `sintetico-${copy}-${event.id}`.slice(0, 80),
        title: `Evento sintético ${copy + 1} · ${event.title}`,
        displayOrder: copy * 100 + event.displayOrder,
        importance: (copy + event.displayOrder) % 3 === 0 ? 'major' : 'minor',
      });
    }
    for (const relation of index.relations)
      relations.push({
        ...relation,
        id: `sintetico-${copy}-${relation.id}`.slice(0, 80),
        fromEventId: `sintetico-${copy}-${relation.fromEventId}`.slice(0, 80),
        toEventId: `sintetico-${copy}-${relation.toEventId}`.slice(0, 80),
      });
  }
  const dense: AtlasIndex = { ...index, events, relations };
  return {
    index: dense,
    detail: async (id: string): Promise<EventDetailFile> => {
      const match = /^sintetico-\d+-(.+)$/.exec(id);
      const original = match?.[1] ?? id;
      const real = await details(
        index.events.find((event) => event.id.startsWith(original.slice(0, 40)))
          ?.id ?? original,
      );
      return { ...real, id, claims: [], relations: [] };
    },
  };
}
