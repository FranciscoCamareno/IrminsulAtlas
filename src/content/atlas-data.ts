import {
  AtlasIndexSchema,
  EntityDetailFileSchema,
  EventDetailFileSchema,
  SearchIndexSchema,
  type AtlasIndex,
  type Dataset,
  type EntityDetailFile,
  type EventDetailFile,
  type Evidence,
  type SearchIndex,
} from '../domain/schema';
import { resolveEvidence } from '../application/catalog';
import { normalizeText, plainText } from '../application/search';

// Build-time projection of the editorial dataset into public static files.
// Nothing here depends on the reader's progress; visibility is applied in the
// browser before anything is rendered, searched or counted.
export interface AtlasData {
  index: AtlasIndex;
  events: Map<string, EventDetailFile>;
  entities: Map<string, EntityDetailFile>;
  search: SearchIndex;
}

export function buildAtlasData(data: Dataset): AtlasData {
  const universe = data.universes[0]!;
  const evidenceViews = (items: readonly Evidence[]) =>
    items.flatMap((evidence) => {
      const resolved = resolveEvidence(evidence, data);
      // Unresolvable or draft sources are never shipped.
      if (!resolved || resolved.source.editorialStatus === 'draft') return [];
      return [
        {
          ...resolved.view,
          spoilerRequirements: [
            ...new Set([
              ...resolved.source.spoilerRequirements,
              ...evidence.spoilerRequirements,
            ]),
          ],
        },
      ];
    });
  const sourceById = new Map(data.sources.map((item) => [item.id, item]));
  const requirementsOf = new Map(
    data.events.map((event) => [event.id, event.spoilerRequirements]),
  );
  // A claim concerning several events is shown only where all of them are open.
  const claimViews = (eventId: string) =>
    data.claims
      .filter((claim) => claim.eventIds.includes(eventId))
      .map((claim) => ({
        id: claim.id,
        text: claim.text,
        kind: claim.kind,
        reviewStatus: claim.review.status,
        spoilerRequirements: [
          ...new Set(
            claim.eventIds.flatMap((id) => requirementsOf.get(id) ?? []),
          ),
        ],
        supports: claim.support.flatMap((support) => {
          const source = sourceById.get(support.sourceId);
          if (!source) return [];
          return [
            {
              sourceTitle: source.title,
              ...(source.url ? { sourceUrl: source.url } : {}),
              tier:
                source.kind === 'document'
                  ? (source.tier ?? 'secondary')
                  : 'secondary',
              locator: support.locator,
              stance: support.stance,
              verification: support.verification,
              limits: support.limits,
              ...(support.fragment
                ? { fragmentId: support.fragment.segmentId }
                : {}),
            },
          ];
        }),
      }));
  const entityName = new Map(
    data.entities.map((entity) => [entity.id, entity.name]),
  );
  const index = AtlasIndexSchema.parse({
    schemaVersion: 1,
    universe: {
      id: universe.id,
      name: universe.name,
      editorialStatus: universe.editorialStatus,
    },
    milestones: data.milestones
      .filter((milestone) => milestone.editorialStatus !== 'draft')
      .map((milestone) => ({
        id: milestone.id,
        safeLabel: milestone.safeLabel,
        track: milestone.track,
      })),
    eras: data.eras
      .filter((era) => era.editorialStatus !== 'draft')
      .map((era) => ({
        id: era.id,
        name: era.name,
        ...(era.description ? { description: era.description } : {}),
        displayOrder: era.displayOrder,
        spoilerRequirements: era.spoilerRequirements,
        editorialStatus: era.editorialStatus,
      })),
    events: data.events
      .filter((event) => event.editorialStatus !== 'draft')
      .map((event) => ({
        id: event.id,
        title: event.title,
        aliases: event.aliases,
        eraId: event.eraId,
        ...(event.narrativeThread
          ? { narrativeThread: event.narrativeThread }
          : {}),
        regions: (event.narrativeThread ?? '')
          .split('/')
          .map((part) => part.trim())
          .filter(Boolean),
        categories: event.categories,
        importance: event.importance,
        ...(event.certainty ? { certainty: event.certainty } : {}),
        entityIds: event.entityIds,
        time: event.time,
        claimStatus: event.claimStatus,
        editorialStatus: event.editorialStatus,
        displayOrder: event.displayOrder,
        spoilerRequirements: event.spoilerRequirements,
        ...(event.dossierSection
          ? { dossierSection: event.dossierSection }
          : {}),
      })),
    entities: data.entities
      .filter((entity) => entity.editorialStatus !== 'draft')
      .map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        aliases: entity.aliases,
        spoilerRequirements: entity.spoilerRequirements,
        editorialStatus: entity.editorialStatus,
        ...(entity.dossierSection
          ? { dossierSection: entity.dossierSection }
          : {}),
      })),
    relations: data.relations
      .filter((relation) => relation.editorialStatus !== 'draft')
      .map((relation) => ({
        id: relation.id,
        fromEventId: relation.fromEventId,
        toEventId: relation.toEventId,
        kind: relation.kind,
        directed: relation.directed,
        claimStatus: relation.claimStatus,
        editorialStatus: relation.editorialStatus,
        spoilerRequirements: relation.spoilerRequirements,
      })),
  });
  const shipped = new Set(index.events.map((event) => event.id));
  const events = new Map<string, EventDetailFile>();
  for (const event of data.events.filter((item) => shipped.has(item.id))) {
    events.set(
      event.id,
      EventDetailFileSchema.parse({
        schemaVersion: 1,
        id: event.id,
        summary: event.summary,
        body: event.body,
        evidence: evidenceViews(event.evidence),
        claims: claimViews(event.id),
        relations: index.relations
          .filter(
            (relation) =>
              relation.fromEventId === event.id ||
              relation.toEventId === event.id,
          )
          .map((relation) => {
            const source = data.relations.find(
              (item) => item.id === relation.id,
            )!;
            return {
              id: relation.id,
              explanation: source.explanation,
              evidence: evidenceViews(source.evidence),
            };
          }),
      }),
    );
  }
  const entities = new Map<string, EntityDetailFile>();
  for (const entity of index.entities) {
    const source = data.entities.find((item) => item.id === entity.id)!;
    entities.set(
      entity.id,
      EntityDetailFileSchema.parse({
        schemaVersion: 1,
        id: entity.id,
        ...(source.body ? { body: source.body } : {}),
      }),
    );
  }
  const search = SearchIndexSchema.parse({
    schemaVersion: 1,
    events: [...events.values()].map((detail) => {
      const event = data.events.find((item) => item.id === detail.id)!;
      return {
        id: detail.id,
        text: normalizeText(
          plainText(
            [
              detail.body,
              ...event.entityIds.map((id) => entityName.get(id) ?? ''),
            ].join(' '),
          ),
        ),
      };
    }),
    entities: [...entities.values()].map((detail) => ({
      id: detail.id,
      text: normalizeText(plainText(detail.body ?? '')),
    })),
  });
  return { index, events, entities, search };
}
