import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { loadDossierContent } from '../src/content/dossier';
import { buildAtlasData } from '../src/content/atlas-data';
import { DossierMapSchema, EvidenceRegistrySchema } from '../src/domain/schema';
import { visibleView } from '../src/application/atlas';

const original = JSON.parse(
  await readFile('content/editorial/genshin-dossier.json', 'utf8'),
);
const reviewer = {
  reviewer: 'Revisor de fixture sintético',
  date: '2026-10-05',
};

// Synthetic approval decisions exercise the workflow without approving real lore.
function fixture() {
  const mapping = DossierMapSchema.parse(structuredClone(original));
  const registry = EvidenceRegistrySchema.parse({
    schemaVersion: 1,
    sources: [
      {
        kind: 'external',
        id: 'fixture-review-source',
        title: 'Fuente sintética de demostración',
        url: 'https://example.org/demo',
        tier: 'primary',
        accessedAt: '2026-10-05',
      },
    ],
    claims: [
      {
        id: 'fixture-review-claim',
        eventIds: [mapping.events[0]!.id],
        text: 'Afirmación sintética para validar el flujo de revisión.',
        kind: 'explicit',
        support: [
          {
            sourceId: 'fixture-review-source',
            locator: 'Demostración',
            stance: 'supports',
            verification: 'verified',
            limits: 'Fixture; no respalda lore real.',
          },
        ],
        review: { status: 'reviewed', ...reviewer },
      },
    ],
  });
  return { mapping, registry };
}

describe('explicit editorial decisions in dossier annotations', () => {
  it('carries an individual approval and classification to the public index without approving other events', async () => {
    const options = fixture();
    const event = options.mapping.events[0]!;
    event.editorialStatus = 'reviewed';
    event.claimStatus = 'fact';
    event.review = reviewer;
    const data = await loadDossierContent(options);
    expect(data.events[0]).toMatchObject({
      editorialStatus: 'reviewed',
      claimStatus: 'fact',
      review: reviewer,
    });
    const index = buildAtlasData(data).index;
    expect(index.events[0]).toMatchObject({
      editorialStatus: 'reviewed',
      claimStatus: 'fact',
    });
    expect(
      index.events
        .slice(1)
        .every((item) => item.editorialStatus === 'provisional'),
    ).toBe(true);
  });

  it('rejects approval without a decision, with pending assertions, or without assertions', async () => {
    const options = fixture();
    options.mapping.events[0]!.editorialStatus = 'reviewed';
    await expect(loadDossierContent(options)).rejects.toThrow(
      'dossier-review-incomplete',
    );
    options.mapping.events[0]!.review = reviewer;
    options.registry.claims[0]!.review.status = 'pending';
    await expect(loadDossierContent(options)).rejects.toThrow(
      'dossier-review-with-pending-claims',
    );
    options.registry.claims = [];
    await expect(loadDossierContent(options)).rejects.toThrow(
      'dossier-review-without-claims',
    );
  });

  it('rejects a reviewed explicit assertion whose support was only cited', async () => {
    const options = fixture();
    options.mapping.events[0]!.editorialStatus = 'reviewed';
    options.mapping.events[0]!.review = reviewer;
    options.registry.claims[0]!.support[0]!.verification = 'cited';
    await expect(loadDossierContent(options)).rejects.toThrow(
      'reviewed-without-verified-support',
    );
  });

  it('keeps an annotated draft out of the index, search and visible relationships', async () => {
    const options = fixture();
    const id = options.mapping.events[0]!.id;
    options.mapping.events[0]!.editorialStatus = 'draft';
    const atlas = buildAtlasData(await loadDossierContent(options));
    expect(atlas.index.events.some((item) => item.id === id)).toBe(false);
    expect(atlas.events.has(id)).toBe(false);
    expect(atlas.search.events.some((item) => item.id === id)).toBe(false);
    const view = visibleView(
      atlas.index,
      new Set(atlas.index.milestones.map((item) => item.id)),
    );
    expect(
      view.relations.some(
        (item) => item.fromEventId === id || item.toEventId === id,
      ),
    ).toBe(false);
  });

  it('requires explicit reviewed assertions covering both ends before approving a relationship', async () => {
    const options = fixture();
    const relation = options.mapping.relations[0]!;
    relation.editorialStatus = 'reviewed';
    relation.review = reviewer;
    relation.claimStatus = 'fact';
    await expect(loadDossierContent(options)).rejects.toThrow(
      'dossier-review-without-claims',
    );
    const claim = options.registry.claims[0]!;
    claim.eventIds = [relation.fromEventId];
    relation.claimIds = [claim.id];
    await expect(loadDossierContent(options)).rejects.toThrow(
      'relation-review-without-endpoint',
    );
    claim.eventIds = [relation.fromEventId, relation.toEventId];
    const data = await loadDossierContent(options);
    expect(data.relations[0]).toMatchObject({
      editorialStatus: 'reviewed',
      claimStatus: 'fact',
      claimIds: [claim.id],
    });
    relation.claimIds = ['fixture-missing-claim'];
    await expect(loadDossierContent(options)).rejects.toThrow(
      'unknown-relation-claim',
    );
  });
});
