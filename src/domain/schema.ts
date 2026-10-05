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
const editorialStatus = z.enum(['draft', 'provisional', 'reviewed', 'demo']);
const claimStatus = z.enum(['fact', 'interpretation', 'theory']);
export const EditorialReviewSchema = z.strictObject({
  reviewer: text,
  date: z.iso.date(),
  note: text.optional(),
});
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
  description: text.optional(),
});
export const NarrativeEntitySchema = z.strictObject({
  ...scoped,
  kind: z.enum(['character', 'place', 'faction']),
  name: text,
  aliases: z.array(text),
  body: text.optional(),
  dossierSection: IdSchema.optional(),
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
  z.strictObject({
    ...sourceFields,
    kind: z.literal('document'),
    work: text,
    // Primary = text of the game itself; secondary = community or editorial reading.
    tier: z.enum(['primary', 'secondary', 'dossier']).optional(),
  }),
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
    narrativeThread: text.optional(),
    dossierSection: IdSchema.optional(),
    certainty: z
      .array(
        z.enum([
          'documented',
          'tradition',
          'approximate',
          'disputed',
          'unknown',
        ]),
      )
      .optional(),
    entityIds: ids,
    evidence: z.array(EvidenceSchema),
    claimStatus,
    review: EditorialReviewSchema.optional(),
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
    review: EditorialReviewSchema.optional(),
    claimIds: ids.default([]),
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

// A claim is one statement the editorial text makes. It is separate from the
// event so that one claim can concern several events and one source can back
// several claims; it records what kind of statement it is and what supports it.
export const ClaimKindSchema = z.enum([
  'explicit',
  'testimony',
  'interpretation',
  'unknown',
]);
export const ClaimSupportSchema = z.strictObject({
  sourceId: IdSchema,
  locator: text,
  // Imported material is pinned to one segment and the hash of its text, so a
  // later import that changes the text is detected instead of silently trusted.
  fragment: z
    .strictObject({
      segmentId: IdSchema,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .optional(),
  stance: z.enum(['supports', 'contradicts', 'context']),
  // verified: the fragment was located and compared with the claim.
  // cited: the source is the one the dossier cites; it was not re-read.
  verification: z.enum(['verified', 'cited']),
  limits: text,
});
export const ClaimSchema = z.strictObject({
  id: IdSchema,
  eventIds: ids.refine((items) => items.length > 0, {
    message: 'Una afirmación necesita al menos un evento',
  }),
  text,
  kind: ClaimKindSchema,
  support: z.array(ClaimSupportSchema),
  review: z.strictObject({
    status: z.enum(['pending', 'reviewed', 'disputed']),
    reviewer: text.optional(),
    date: z.iso.date().optional(),
    note: text.optional(),
  }),
});

export const EditorialContentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  universes: z.array(UniverseSchema).min(1),
  eras: z.array(EraSchema),
  entities: z.array(NarrativeEntitySchema),
  milestones: z.array(MilestoneSchema),
  events: z.array(EventSchema),
  relations: z.array(RelationSchema),
  // Claim-level traceability (see EvidenceRegistrySchema); optional for fixtures.
  claims: z.array(ClaimSchema).default([]),
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

// Import contracts describe source material, never historical events.
// Imported text is deliberately not trimmed: its original bytes/hash matter.
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const CommitSchema = z.string().regex(/^[a-f0-9]{40}$/);
export const SnapshotPathSchema = z
  .string()
  .regex(/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+$/)
  .refine(
    (path) => !path.split('/').some((part) => part === '.' || part === '..'),
  );
export const SnapshotManifestSchema = z
  .object({
    manifestVersion: z.literal(1),
    repository: z.literal('https://github.com/DimbreathBot/AnimeGameData'),
    commit: CommitSchema,
    language: z.literal('ES'),
    commitDate: z.iso.datetime().optional(),
    providerDeclaredBuild: z
      .object({
        value: text,
        sourceCommit: CommitSchema,
        note: text.optional(),
      })
      .optional(),
    contentOrigin: z.enum(['provider', 'synthetic']).default('provider'),
    files: z
      .array(
        z.object({
          path: SnapshotPathSchema,
          bytes: z.number().int().nonnegative(),
          sha256: Sha256Schema,
          gitBlobSha1: CommitSchema,
          acquiredAt: z.iso.datetime().optional(),
        }),
      )
      .min(1),
  })
  .refine(
    (manifest) =>
      new Set(manifest.files.map((file) => file.path)).size ===
      manifest.files.length,
    {
      message: 'Archivo duplicado en el manifiesto',
      path: ['files'],
    },
  );

export const ImportSelectionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  adapterVersion: z.literal('animegamedata-7.1-p1-v1'),
  quests: z.array(z.number().int().positive()),
  ambientNpcs: z.array(z.number().int().positive()),
  hangouts: z.array(
    z.strictObject({
      chapterId: z.number().int().positive(),
      conversationFiles: z.array(SnapshotPathSchema).min(1),
    }),
  ),
  documents: z.array(
    z.strictObject({
      id: z.number().int().positive(),
      kind: z.enum([
        'book',
        'letter',
        'document',
        'document',
        'weapon-story',
        'artifact-story',
      ]),
    }),
  ),
  characterStories: z.array(z.number().int().positive()),
  exclusions: z.array(z.strictObject({ sourceId: IdSchema, reason: text })),
});

export const SourceLocatorSchema = z.strictObject({
  path: SnapshotPathSchema,
  pointer: z.string(),
  fileSha256: Sha256Schema,
});
export const ImportedTextSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('available'),
    value: z.string().min(1),
    sha256: Sha256Schema,
    textMapHash: z.string().regex(/^\d+$/).nullable(),
    origin: SourceLocatorSchema,
  }),
  z.strictObject({
    status: z.literal('missing'),
    textMapHash: z.string().regex(/^\d+$/).nullable(),
    reason: text,
  }),
]);
export const SourceSegmentSchema = z.strictObject({
  id: IdSchema,
  externalId: text,
  locator: SourceLocatorSchema,
  // Position in the provider file; not historical/revelation order or identity.
  sourceOrder: order,
  text: ImportedTextSchema,
  speaker: z.strictObject({
    externalId: z.string().nullable(),
    roleType: z.string().nullable(),
    name: z.string().nullable(),
  }),
  nextSegmentIds: ids,
  endsConversation: z.boolean(),
  // Conditions and opaque fields survive; unsafe integers are exact decimal strings.
  original: z.json(),
});
export const SourceRecordSchema = z.strictObject({
  id: IdSchema,
  providerId: z.literal('animegamedata'),
  externalId: text,
  language: z.literal('es'),
  kind: z.enum([
    'mission',
    'ambient-dialogue',
    'hangout',
    'book',
    'letter',
    'document',
    'character-story',
    'weapon-story',
    'artifact-story',
  ]),
  title: z.string().min(1),
  locator: SourceLocatorSchema,
  metadataLocators: z.array(SourceLocatorSchema),
  editorialStatus: z.literal('draft'),
  // P1 review concerns source coverage; it is not approval of inferred events/spoilers.
  publication: z.literal('not-publishable'),
  context: z.json(),
  conversations: z.array(
    z.strictObject({
      id: IdSchema,
      locator: SourceLocatorSchema,
      rootSegmentId: IdSchema.nullable(),
    }),
  ),
  segments: z.array(SourceSegmentSchema).min(1),
});
export const ImportedDatasetSchema = z.strictObject({
  schemaVersion: z.literal(1),
  adapterVersion: ImportSelectionSchema.shape.adapterVersion,
  snapshot: SnapshotManifestSchema,
  selectionSha256: Sha256Schema,
  sources: z.array(SourceRecordSchema),
});
export const ImportIssueSchema = z.strictObject({
  severity: z.enum(['error', 'warning']),
  code: text,
  category: text,
  file: z.string(),
  field: z.string(),
  id: z.string().nullable(),
  message: text,
});
export const ImportReportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  status: z.enum(['valid', 'rejected']),
  snapshotCommit: CommitSchema.nullable(),
  adapterVersion: ImportSelectionSchema.shape.adapterVersion,
  filesVerified: order,
  sourcesProcessed: order,
  sourcesAccepted: order,
  sourcesExcluded: order,
  segmentsAccepted: order,
  unresolvedTexts: order,
  categories: z.array(
    z.strictObject({
      category: text,
      processed: order,
      accepted: order,
      excluded: order,
    }),
  ),
  issues: z.array(ImportIssueSchema),
});
export const ImportCandidateSchema = z.strictObject({
  schemaVersion: z.literal(1),
  dataset: ImportedDatasetSchema,
  selection: ImportSelectionSchema,
});
export const ImportDiffSchema = z.strictObject({
  added: ids,
  changed: ids,
  removed: ids,
  unchanged: ids,
});
export const AcceptedImportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  version: Sha256Schema,
  previousVersion: Sha256Schema.nullable(),
});
export type SnapshotManifest = z.infer<typeof SnapshotManifestSchema>;
export type ImportSelection = z.infer<typeof ImportSelectionSchema>;
export type SourceLocator = z.infer<typeof SourceLocatorSchema>;
export type ImportedText = z.infer<typeof ImportedTextSchema>;
export type SourceSegment = z.infer<typeof SourceSegmentSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type ImportedDataset = z.infer<typeof ImportedDatasetSchema>;
export type ImportIssue = z.infer<typeof ImportIssueSchema>;
export type ImportReport = z.infer<typeof ImportReportSchema>;
export type ImportCandidate = z.infer<typeof ImportCandidateSchema>;
export type ImportDiff = z.infer<typeof ImportDiffSchema>;
export type AcceptedImport = z.infer<typeof AcceptedImportSchema>;

// Local dossier annotations. Prose remains in the supplied Markdown documents.
const dossierEditorial = {
  editorialStatus: EventSchema.shape.editorialStatus
    .exclude(['demo'])
    .default('provisional'),
  claimStatus: EventSchema.shape.claimStatus.default('interpretation'),
  review: EventSchema.shape.review,
};
export const DossierMapSchema = z.strictObject({
  eras: z.array(
    z.strictObject({ id: IdSchema, name: text, description: text }),
  ),
  events: z.array(
    z.strictObject({
      id: IdSchema,
      sectionId: IdSchema,
      title: text.optional(),
      eraId: IdSchema,
      narrativeThread: text,
      entityIds: ids,
      time: HistoricalTimeSchema,
      importance: z.enum(['major', 'minor']),
      certainty: EventSchema.shape.certainty,
      // Editorial categories for the category filter; a proposal until reviewed.
      categories: z.array(text).min(1).optional(),
      ...dossierEditorial,
    }),
  ),
  // Groups that act as factions (shown under their own filter), not as people.
  factions: ids.default([]),
  relations: z.array(
    z.strictObject({
      id: IdSchema,
      fromEventId: IdSchema,
      toEventId: IdSchema,
      kind: z.enum(['association', 'precedes', 'causes', 'mentions']),
      explanation: text,
      sectionId: IdSchema,
      ...dossierEditorial,
      // Assertions selected by the reviewer to support this relationship.
      claimIds: RelationSchema.shape.claimIds,
    }),
  ),
});
export type DossierMap = z.infer<typeof DossierMapSchema>;

// Revelation order is editorial data kept apart from the dossier prose. It says
// when a reader of the game may meet a piece of content, never when it happened.
export const RevelationMapSchema = z.strictObject({
  status: z.enum(['provisional', 'reviewed']),
  note: text,
  // Ordered ladder: choosing a milestone also grants every earlier one.
  milestones: z.array(z.strictObject({ id: IdSchema, safeLabel: text })).min(1),
  events: z.record(IdSchema, IdSchema),
  // Entities inherit the latest milestone of their events unless overridden.
  entityOverrides: z.record(IdSchema, IdSchema),
  unlinkedEntityMilestone: IdSchema,
});
export type RevelationMap = z.infer<typeof RevelationMapSchema>;

// Public static files. The lightweight index serves search, filters and the
// timeline; long prose and evidence live in per-item detail files.
export const IndexEraSchema = z.strictObject({
  id: IdSchema,
  name: text,
  description: text.optional(),
  displayOrder: order,
  spoilerRequirements: ids,
  editorialStatus,
});
export const IndexEventSchema = z.strictObject({
  id: IdSchema,
  title: text,
  aliases: z.array(text),
  eraId: IdSchema,
  narrativeThread: text.optional(),
  regions: z.array(text),
  categories: z.array(text),
  importance: z.enum(['major', 'minor']),
  certainty: EventSchema.shape.certainty,
  entityIds: ids,
  time: HistoricalTimeSchema,
  claimStatus,
  editorialStatus,
  displayOrder: order,
  spoilerRequirements: ids,
  dossierSection: IdSchema.optional(),
});
export const IndexEntitySchema = z.strictObject({
  id: IdSchema,
  kind: NarrativeEntitySchema.shape.kind,
  name: text,
  aliases: z.array(text),
  spoilerRequirements: ids,
  editorialStatus,
  dossierSection: IdSchema.optional(),
});
export const IndexRelationSchema = z.strictObject({
  id: IdSchema,
  fromEventId: IdSchema,
  toEventId: IdSchema,
  kind: RelationSchema.shape.kind,
  directed: z.boolean(),
  claimStatus,
  editorialStatus,
  spoilerRequirements: ids,
});
export const AtlasIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  universe: z.strictObject({ id: IdSchema, name: text, editorialStatus }),
  milestones: z.array(z.strictObject({ id: IdSchema, safeLabel: text })),
  eras: z.array(IndexEraSchema),
  events: z.array(IndexEventSchema),
  entities: z.array(IndexEntitySchema),
  relations: z.array(IndexRelationSchema),
});
// What the reader sees for one claim; support is resolved to titles and links.
export const ClaimViewSchema = z.strictObject({
  id: IdSchema,
  text,
  kind: ClaimKindSchema,
  reviewStatus: ClaimSchema.shape.review.shape.status,
  // Union of the requirements of every event the claim concerns.
  spoilerRequirements: ids,
  supports: z.array(
    z.strictObject({
      sourceTitle: text,
      sourceUrl: z.string().optional(),
      tier: z.enum(['primary', 'secondary', 'dossier']),
      locator: text,
      stance: ClaimSupportSchema.shape.stance,
      verification: ClaimSupportSchema.shape.verification,
      limits: text,
      fragmentId: IdSchema.optional(),
    }),
  ),
});
export type ClaimView = z.infer<typeof ClaimViewSchema>;
export const EvidenceViewSchema = z.strictObject({
  sourceId: IdSchema,
  sourceTitle: text,
  locator: text,
  claim: text,
  stance: z.enum(['supports', 'contradicts']),
  note: text.optional(),
  sourceUrl: z.string().optional(),
  availability: text,
  // Union of the evidence and source requirements.
  spoilerRequirements: ids,
});
export const EventDetailFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: IdSchema,
  summary: text,
  body: text,
  evidence: z.array(EvidenceViewSchema),
  claims: z.array(ClaimViewSchema),
  relations: z.array(
    z.strictObject({
      id: IdSchema,
      explanation: text,
      evidence: z.array(EvidenceViewSchema),
    }),
  ),
});
export const EntityDetailFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: IdSchema,
  body: text.optional(),
});
// Normalized plain text per item, fetched only when the reader searches.
export const SearchIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  events: z.array(z.strictObject({ id: IdSchema, text: z.string() })),
  entities: z.array(z.strictObject({ id: IdSchema, text: z.string() })),
});
export type AtlasIndex = z.infer<typeof AtlasIndexSchema>;
export type IndexEvent = z.infer<typeof IndexEventSchema>;
export type IndexEntity = z.infer<typeof IndexEntitySchema>;
export type IndexRelation = z.infer<typeof IndexRelationSchema>;
export type EvidenceViewData = z.infer<typeof EvidenceViewSchema>;
export type EventDetailFile = z.infer<typeof EventDetailFileSchema>;
export type EntityDetailFile = z.infer<typeof EntityDetailFileSchema>;
export type SearchIndex = z.infer<typeof SearchIndexSchema>;

// Full dossier documents are served as data, gated by the reader's progress.
export const DossierDocumentFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: IdSchema,
  title: text,
  body: text,
});
export type DossierDocumentFile = z.infer<typeof DossierDocumentFileSchema>;

// Editorial evidence registry: sources and claims, kept apart from the prose.
export const RegistrySourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('imported'),
    id: IdSchema,
    importedId: IdSchema,
    snapshotCommit: CommitSchema,
    title: text,
    sourceKind: SourceRecordSchema.shape.kind,
    locator: SourceLocatorSchema,
  }),
  z.strictObject({
    kind: z.literal('external'),
    id: IdSchema,
    title: text,
    url: z.url({ protocol: /^https?$/ }),
    tier: z.enum(['primary', 'secondary']),
    accessedAt: z.iso.date().optional(),
    note: text.optional(),
  }),
]);
export const EvidenceRegistrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  sources: z.array(RegistrySourceSchema),
  claims: z.array(ClaimSchema),
});
export type Claim = z.infer<typeof ClaimSchema>;
export type ClaimSupport = z.infer<typeof ClaimSupportSchema>;
export type RegistrySource = z.infer<typeof RegistrySourceSchema>;
export type EvidenceRegistry = z.infer<typeof EvidenceRegistrySchema>;
