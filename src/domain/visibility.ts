import type { Dataset, LoreEvent, Relation } from './schema';

export type Progress = ReadonlySet<string>;
type Guarded = {
  spoilerRequirements: readonly string[];
  editorialStatus?: string;
};

export function meetsRequirements(
  requirements: readonly string[],
  progress: Progress,
): boolean {
  return requirements.every((id) => progress.has(id));
}

export function isVisible(item: Guarded, progress: Progress): boolean {
  return (
    item.editorialStatus !== 'draft' &&
    meetsRequirements(item.spoilerRequirements, progress)
  );
}

export function isEventVisible(
  event: LoreEvent,
  data: Dataset,
  progress: Progress,
): boolean {
  const era = data.eras.find((item) => item.id === event.eraId);
  const universe = data.universes.find((item) => item.id === event.universeId);
  return (
    !!era &&
    !!universe &&
    universe.editorialStatus !== 'draft' &&
    isVisible(era, progress) &&
    isVisible(event, progress)
  );
}

export function isRelationVisible(
  relation: Relation,
  data: Dataset,
  progress: Progress,
): boolean {
  const from = data.events.find((item) => item.id === relation.fromEventId);
  const to = data.events.find((item) => item.id === relation.toEventId);
  return (
    !!from &&
    !!to &&
    isVisible(relation, progress) &&
    isEventVisible(from, data, progress) &&
    isEventVisible(to, data, progress)
  );
}
