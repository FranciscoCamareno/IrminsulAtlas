import { z } from 'zod';

// Contracts have one source of truth: schemas. TypeScript types are inferred below.
export const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const ids = z
  .array(IdSchema)
  .refine((items) => new Set(items).size === items.length, {
    message: 'Las referencias no deben repetirse',
  });
const order = z.number().int().nonnegative();
const editorialStatus = z.enum(['draft', 'reviewed', 'demo']);
const claimStatus = z.enum(['fact', 'interpretation', 'theory']);
const scoped = {
  id: IdSchema,
  universeId: IdSchema,
  spoilerRequirements: ids,
  editorialStatus,
};

export const HistoricalTimeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('exact'),
    system: IdSchema,
    value: z.number(),
    label: text,
  }),
  z.strictObject({
    kind: z.literal('approximate'),
    system: IdSchema,
    reference: z.number(),
    margin: z.number().nonnegative().optional(),
    label: text,
  }),
  z
    .strictObject({
      kind: z.literal('range'),
      system: IdSchema,
      start: z.number(),
      end: z.number(),
      approximate: z.boolean(),
      label: text,
    })
    .refine((time) => time.start <= time.end, {
      message: 'Intervalo invertido',
      path: ['end'],
    }),
  z
    .strictObject({ kind: z.literal('relative'), before: ids, after: ids })
    .refine((time) => time.before.length + time.after.length > 0, {
      message: 'El orden relativo necesita al menos una referencia',
    }),
  z.strictObject({ kind: z.literal('unknown'), label: text }),
]);

export const UniverseSchema = z.strictObject({
  id: IdSchema,
  name: text,
  defaultLanguage: text,
  temporalSystems: z
    .array(z.strictObject({ id: IdSchema, label: text, convention: text }))
    .min(1),
  editorialStatus,
});
export const EraSchema = z.strictObject({
  ...scoped,
  name: text,
  displayOrder: order,
  bounds: HistoricalTimeSchema.optional(),
});
export const NarrativeEntitySchema = z.strictObject({
  ...scoped,
  kind: z.enum(['character', 'place', 'faction']),
  name: text,
  aliases: z.array(text),
});
export const MilestoneSchema = z.strictObject({
  id: IdSchema,
  universeId: IdSchema,
  // This is a deliberately safe selector label, not the title of a hidden mission.
  safeLabel: text,
  editorialStatus,
});
export const EvidenceSchema = z.strictObject({
  sourceId: IdSchema,
  locator: text,
  claim: text,
  stance: z.enum(['supports', 'contradicts']),
  note: text.optional(),
  spoilerRequirements: ids,
});
const sourceFields = {
  ...scoped,
  title: text,
  language: text,
  locator: text,
  url: z.url({ protocol: /^https?$/ }).optional(),
  accessedAt: z.iso.date().optional(),
};

// Normalized mission IS a source. Missing text is explicit, never invented.
export const MissionSchema = z.strictObject({
  ...sourceFields,
  kind: z.literal('mission'),
  providerId: IdSchema,
  externalId: text,
  snapshotVersion: text,
  prerequisiteExternalIds: z.array(text),
  text: z.discriminatedUnion('status', [
    z.strictObject({ status: z.literal('available'), value: text }),
    z.strictObject({ status: z.literal('missing'), reason: text }),
  ]),
});
export const SourceSchema = z.discriminatedUnion('kind', [
  MissionSchema,
  z.strictObject({ ...sourceFields, kind: z.literal('document'), work: text }),
]);
export const EventSchema = z
  .strictObject({
    ...scoped,
    slug: IdSchema,
    language: text,
    title: text,
    aliases: z.array(text),
    summary: text,
    body: text,
    eraId: IdSchema,
    time: HistoricalTimeSchema,
    displayOrder: order,
    revelation: z.strictObject({ order, milestoneIds: ids }),
    importance: z.enum(['major', 'minor']),
    categories: z.array(text),
    entityIds: ids,
    evidence: z.array(EvidenceSchema),
    claimStatus,
  })
  .refine(
    (event) =>
      event.editorialStatus !== 'reviewed' || event.evidence.length > 0,
    {
      message: 'Un evento revisado necesita fuentes',
      path: ['evidence'],
    },
  );
export const RelationSchema = z
  .strictObject({
    ...scoped,
    fromEventId: IdSchema,
    toEventId: IdSchema,
    kind: z.enum(['association', 'precedes', 'causes', 'mentions']),
    directed: z.boolean(),
    explanation: text,
    evidence: z.array(EvidenceSchema),
    claimStatus,
  })
  .refine(
    (relation) =>
      !['precedes', 'causes'].includes(relation.kind) || relation.directed,
    {
      message: 'Anterioridad y causalidad requieren dirección',
      path: ['directed'],
    },
  )
  .refine(
    (relation) => relation.kind !== 'causes' || relation.evidence.length > 0,
    {
      message: 'Una relación causal necesita evidencia',
      path: ['evidence'],
    },
  );

export const EditorialContentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  universes: z.array(UniverseSchema).min(1),
  eras: z.array(EraSchema),
  entities: z.array(NarrativeEntitySchema),
  milestones: z.array(MilestoneSchema),
  events: z.array(EventSchema),
  relations: z.array(RelationSchema),
});
export const DatasetSchema = EditorialContentSchema.extend({
  sources: z.array(SourceSchema),
});

export type Universe = z.infer<typeof UniverseSchema>;
export type Era = z.infer<typeof EraSchema>;
export type NarrativeEntity = z.infer<typeof NarrativeEntitySchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type HistoricalTime = z.infer<typeof HistoricalTimeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type LoreEvent = z.infer<typeof EventSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
