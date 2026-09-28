import type {
  Dataset,
  Evidence,
  HistoricalTime,
  LoreEvent,
} from '../domain/schema';
import {
  isEventVisible,
  isRelationVisible,
  isVisible,
  type Progress,
} from '../domain/visibility';

function timeLabel(
  time: HistoricalTime,
  data: Dataset,
  progress: Progress,
): string {
  switch (time.kind) {
    case 'unknown':
      return time.label === 'Fecha desconocida'
        ? time.label
        : `Fecha desconocida · ${time.label}`;
    case 'exact':
      return time.label;
    case 'range':
      return `${time.approximate ? 'Intervalo aproximado' : 'Intervalo'} · ${time.label}`;
    case 'approximate':
      return `Aprox. · ${time.label}${time.margin === undefined ? '' : ` (margen: ±${time.margin})`}`;
    case 'relative': {
      const parts = (['after', 'before'] as const).flatMap((direction) =>
        time[direction].flatMap((id) => {
          const event = data.events.find((item) => item.id === id);
          return event && isEventVisible(event, data, progress)
            ? [
                `${direction === 'after' ? 'Después de' : 'Antes de'} «${event.title}»`,
              ]
            : [];
        }),
      );
      return parts.length
        ? `Orden relativo · ${parts.join('; ')}`
        : 'Orden relativo · referencias no disponibles con este progreso';
    }
  }
}

function eventSummary(event: LoreEvent, data: Dataset, progress: Progress) {
  return {
    id: event.id,
    narrativeThread: event.narrativeThread,
    dossierSection: event.dossierSection,
    certainty: event.certainty,
    categories: event.categories,
    eraId: event.eraId,
    title: event.title,
    summary: event.summary,
    eraName: data.eras.find((era) => era.id === event.eraId)?.name ?? '',
    timeLabel: timeLabel(event.time, data, progress),
    importance: event.importance,
    claimStatus: event.claimStatus,
    editorialStatus: event.editorialStatus,
  };
}

function visibleEvidence(
  items: readonly Evidence[],
  data: Dataset,
  progress: Progress,
) {
  return items.flatMap((evidence) => {
    const source = data.sources.find((item) => item.id === evidence.sourceId);
    if (
      !source ||
      !isVisible(source, progress) ||
      !isVisible(evidence, progress)
    )
      return [];
    return [
      {
        sourceId: source.id,
        sourceTitle: source.title,
        locator: evidence.locator,
        claim: evidence.claim,
        stance: evidence.stance,
        note: evidence.note,
        sourceUrl:
          source.url ??
          (source.id.startsWith('source-dossier-')
            ? '/dossier/' +
              source.id.slice('source-dossier-'.length) +
              '/#' +
              evidence.locator.split('#')[1]
            : undefined),
        availability:
          source.kind === 'document'
            ? source.id.startsWith('source-dossier-')
              ? 'Texto del dossier'
              : 'Referencia externa sin contrastar'
            : source.text.status === 'missing'
              ? 'Solo metadatos'
              : 'Texto disponible',
      },
    ];
  });
}

export function listVisibleEvents(data: Dataset, progress: Progress) {
  const eraOrder = (event: LoreEvent) =>
    data.eras.find((era) => era.id === event.eraId)?.displayOrder ?? 0;
  return data.events
    .filter((event) => isEventVisible(event, data, progress))
    .sort(
      (a, b) =>
        eraOrder(a) - eraOrder(b) ||
        a.displayOrder - b.displayOrder ||
        a.id.localeCompare(b.id),
    )
    .map((event) => eventSummary(event, data, progress));
}

export function getVisibleRelations(
  data: Dataset,
  eventId: string,
  progress: Progress,
) {
  return data.relations
    .filter(
      (relation) =>
        (relation.fromEventId === eventId || relation.toEventId === eventId) &&
        isRelationVisible(relation, data, progress),
    )
    .map((relation) => ({
      id: relation.id,
      kind: relation.kind,
      directed: relation.directed,
      from: eventSummary(
        data.events.find((event) => event.id === relation.fromEventId)!,
        data,
        progress,
      ),
      to: eventSummary(
        data.events.find((event) => event.id === relation.toEventId)!,
        data,
        progress,
      ),
      explanation: relation.explanation,
      claimStatus: relation.claimStatus,
      evidence: visibleEvidence(relation.evidence, data, progress),
    }));
}

export function getEventById(data: Dataset, id: string, progress: Progress) {
  const event = data.events.find((item) => item.id === id);
  if (!event) return { status: 'not-found' } as const;
  if (!isEventVisible(event, data, progress))
    return { status: 'blocked' } as const;
  return {
    status: 'visible',
    event: {
      ...eventSummary(event, data, progress),
      body: event.body,
      entities: data.entities
        .filter(
          (entity) =>
            event.entityIds.includes(entity.id) && isVisible(entity, progress),
        )
        .map((entity) => ({
          id: entity.id,
          name: entity.name,
          kind: entity.kind,
        })),
      evidence: visibleEvidence(event.evidence, data, progress),
      relations: getVisibleRelations(data, id, progress),
    },
  } as const;
}

export function listProgressOptions(data: Dataset) {
  return data.milestones
    .filter((milestone) => milestone.editorialStatus !== 'draft')
    .map((milestone) => ({ id: milestone.id, label: milestone.safeLabel }));
}

// This is the only input to the timeline: no hidden nodes or edges reach layout.
export function getVisibleTimeline(data: Dataset, progress: Progress) {
  const events = listVisibleEvents(data, progress);
  const eventIds = new Set(events.map((event) => event.id));
  return {
    events,
    eras: data.eras
      .filter((era) => events.some((event) => event.eraId === era.id))
      .sort(
        (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
      )
      .map((era) => ({
        id: era.id,
        name: era.name,
        description: era.description,
      })),
    relations: data.relations
      .filter(
        (relation) =>
          eventIds.has(relation.fromEventId) &&
          eventIds.has(relation.toEventId) &&
          isRelationVisible(relation, data, progress),
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

export type TimelineContent = ReturnType<typeof getVisibleTimeline>;

export type EventSummary = ReturnType<typeof listVisibleEvents>[number];
export type EventDetail = Extract<
  ReturnType<typeof getEventById>,
  { status: 'visible' }
>['event'];

export function listVisibleEntities(data: Dataset, progress: Progress) {
  return data.entities
    .filter((entity) => isVisible(entity, progress))
    .map((entity) => ({
      id: entity.id,
      name: entity.name,
      kind: entity.kind,
    }));
}
export function getEntityById(data: Dataset, id: string, progress: Progress) {
  const entity = data.entities.find((item) => item.id === id);
  if (!entity) return { status: 'not-found' } as const;
  if (!isVisible(entity, progress)) return { status: 'blocked' } as const;
  const associatedIds = new Set(
    data.events
      .filter((event) => event.entityIds.includes(id))
      .map((event) => event.id),
  );
  return {
    status: 'visible',
    entity,
    events: listVisibleEvents(data, progress).filter((event) =>
      associatedIds.has(event.id),
    ),
  } as const;
}
