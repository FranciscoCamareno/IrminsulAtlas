import { describe, expect, it } from 'vitest';
import { composeCorpora } from '../src/content/corpora';
import { loadDossierContent } from '../src/content/dossier';
import { buildAtlasData } from '../src/content/atlas-data';
import type { CorpusFile } from '../src/domain/schema';

const base = await loadDossierContent();
const baseEvent = base.events[0]!;
const reusedEntity = base.entities[0]!;

// SYNTHETIC DEMO FIXTURE: invented ids and text, not game lore.
const demoEvent = (id: string, status: 'draft' | 'provisional') => ({
  ...structuredClone(baseEvent),
  id,
  slug: id,
  title: 'Demostración ' + id,
  summary: 'Resumen de demostración sintético.',
  body: 'Cuerpo de demostración sintético.',
  aliases: [],
  entityIds: [reusedEntity.id],
  editorialStatus: status,
  spoilerRequirements: [base.milestones[0]!.id],
  dossierSection: undefined,
  evidence: [
    {
      sourceId: 'ext-demo',
      locator: 'Demostración',
      claim: 'Demostración',
      stance: 'supports' as const,
      spoilerRequirements: [],
    },
  ],
});
const corpus = (): CorpusFile => ({
  schemaVersion: 1,
  corpus: 'demo-viajero',
  milestones: [],
  eras: [],
  entities: [],
  events: [
    demoEvent('demo-publicado', 'provisional'),
    demoEvent('demo-borrador', 'draft'),
  ],
  relations: [
    {
      ...structuredClone(base.relations[0]!),
      id: 'demo-rel-borrador',
      fromEventId: 'demo-publicado',
      toEventId: 'demo-borrador',
      claimIds: [],
    },
  ],
  evidence: {
    schemaVersion: 1,
    sources: [
      {
        kind: 'external',
        id: 'ext-demo',
        title: 'Fuente de demostración',
        url: 'https://example.org/demo',
        tier: 'secondary',
      },
    ],
    claims: [
      {
        id: 'claim-demo-solo-borrador',
        eventIds: ['demo-borrador'],
        text: 'Afirmación solo del borrador.',
        kind: 'interpretation',
        support: [],
        review: { status: 'pending' },
      },
      {
        id: 'claim-demo-compartida',
        eventIds: ['demo-publicado', 'demo-borrador'],
        text: 'Afirmación de dos acontecimientos.',
        kind: 'interpretation',
        support: [],
        review: { status: 'pending' },
      },
    ],
  },
});

describe('corpus composition', () => {
  it('publishes a corpus event through index, details and search while keeping base ids', () => {
    const data = composeCorpora(base, [corpus()]);
    const atlas = buildAtlasData(data);
    expect(data.events.map((event) => event.id)).toContain('demo-publicado');
    expect(atlas.index.events.some((e) => e.id === 'demo-publicado')).toBe(
      true,
    );
    expect(atlas.events.has('demo-publicado')).toBe(true);
    expect(JSON.stringify(atlas.search)).toContain('demo-publicado');
    for (const event of base.events)
      expect(data.events.find((item) => item.id === event.id)?.title).toBe(
        event.title,
      );
  });
  it('never publishes drafts or what depends only on them', () => {
    const data = composeCorpora(base, [corpus()]);
    const atlas = buildAtlasData(data);
    expect(data.events.some((event) => event.id === 'demo-borrador')).toBe(
      false,
    );
    expect(data.relations.some((r) => r.id === 'demo-rel-borrador')).toBe(
      false,
    );
    expect(data.claims.some((c) => c.id === 'claim-demo-solo-borrador')).toBe(
      false,
    );
    const shared = data.claims.find((c) => c.id === 'claim-demo-compartida')!;
    expect(shared.eventIds).toEqual(['demo-publicado']);
    expect(JSON.stringify(atlas)).not.toContain('demo-borrador');
  });
  it('rejects a second identity for an id already in the ancient corpus', () => {
    const duplicate = corpus();
    duplicate.entities.push({ ...structuredClone(reusedEntity) });
    expect(() => composeCorpora(base, [duplicate])).toThrow(/ID duplicado/);
    const clash = corpus();
    clash.events[0]!.id = baseEvent.id;
    expect(() => composeCorpora(base, [clash])).toThrow();
  });
  it('rejects evidence about events that do not exist', () => {
    const broken = corpus();
    broken.evidence.claims[1]!.eventIds = ['no-existe'];
    expect(() => composeCorpora(base, [broken])).toThrow(/Evento inexistente/);
  });
  it('leaves the ancient dataset untouched when there are no corpora', () => {
    expect(composeCorpora(base, [])).toEqual(base);
  });
});
