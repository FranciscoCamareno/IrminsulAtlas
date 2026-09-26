import { describe, expect, it } from 'vitest';
import { loadLocalContent } from '../src/content/local';
import {
  DatasetSchema,
  HistoricalTimeSchema,
  MissionSchema,
  type Mission,
} from '../src/domain/schema';
import { findIntegrityIssues } from '../src/domain/integrity';

const fixture = await loadLocalContent();
const copy = () => structuredClone(fixture);

describe('input boundaries', () => {
  it('loads the two local files into a valid, explicitly synthetic dataset', () => {
    expect(findIntegrityIssues(fixture)).toEqual([]);
    expect(
      fixture.events.every((event) => event.editorialStatus === 'demo'),
    ).toBe(true);
    expect(new Set(fixture.events.map((event) => event.time.kind)).size).toBe(
      5,
    );
    expect(fixture.events[1]!.evidence).toHaveLength(2);
  });
  it.each([
    {
      kind: 'range',
      system: 'demo-cycle',
      start: 20,
      end: 10,
      approximate: true,
      label: 'Invertido',
    },
    {
      kind: 'approximate',
      system: 'demo-cycle',
      reference: 10,
      margin: -1,
      label: 'Margen inválido',
    },
    { kind: 'unknown', label: 'Sin fecha', value: 0 },
    { kind: 'relative', before: [], after: [] },
  ])('rejects invalid temporal data: $kind', (input) => {
    expect(HistoricalTimeSchema.safeParse(input).success).toBe(false);
  });
  it('rejects missing required fields and visual coordinates in historical records', () => {
    const data = copy();
    expect(
      DatasetSchema.safeParse({
        ...data,
        events: [{ ...data.events[0], title: undefined }],
      }).success,
    ).toBe(false);
    expect(
      DatasetSchema.safeParse({
        ...data,
        events: [{ ...data.events[0], x: 42 }],
      }).success,
    ).toBe(false);
  });
  it('rejects unsafe source links and available-but-empty mission text', () => {
    const source = fixture.sources[0]!;
    expect(
      MissionSchema.safeParse({ ...source, url: 'javascript:alert(1)' })
        .success,
    ).toBe(false);
    expect(
      MissionSchema.safeParse({
        ...source,
        text: { status: 'available', value: '' },
      }).success,
    ).toBe(false);
  });
  it('retains explicitly incomplete mission metadata without fabricating text', () => {
    const mission = MissionSchema.parse(fixture.sources[1]);
    expect(mission.text.status).toBe('missing');
    expect(mission.text).not.toHaveProperty('value');
  });
  it('rejects a partial adapter result instead of silently dropping broken evidence', async () => {
    await expect(
      loadLocalContent({ loadMissions: async () => [] }),
    ).rejects.toThrow(/evidence.*sourceId/);
    const invalid = [
      { ...fixture.sources[0], snapshotVersion: undefined },
    ] as unknown as Mission[];
    await expect(
      loadLocalContent({ loadMissions: async () => invalid }),
    ).rejects.toThrow('snapshotVersion');
    expect(await loadLocalContent()).toEqual(fixture);
  });
});

describe('dataset integrity', () => {
  it('rejects globally duplicated IDs, scoped slugs, and mission identities', () => {
    const data = copy();
    data.events[1]!.id = data.events[0]!.id;
    data.events[1]!.slug = data.events[0]!.slug;
    data.sources.push({ ...data.sources[0]!, id: 'demo-source-03' });
    const messages = findIntegrityIssues(data)
      .map((issue) => issue.message)
      .join('\n');
    expect(messages).toMatch(/ID duplicado/);
    expect(messages).toMatch(/Slug duplicado/);
    expect(messages).toMatch(/Misión duplicada/);
  });
  it('identifies missing references in event, evidence, relation and spoiler fields', () => {
    const data = copy();
    data.events[0]!.eraId = 'missing-era';
    data.events[0]!.entityIds = ['missing-entity'];
    data.events[0]!.evidence[0]!.sourceId = 'missing-source';
    data.relations[0]!.toEventId = 'missing-event';
    data.events[0]!.spoilerRequirements = ['missing-milestone'];
    const paths = findIntegrityIssues(data).map((issue) => issue.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'events[0].eraId',
        'events[0].entityIds[0]',
        'events[0].evidence[0].sourceId',
        'relations[0].toEventId',
        'events[0].spoilerRequirements[0]',
      ]),
    );
  });
  it('rejects cross-universe references and undeclared temporal systems', () => {
    const data = copy();
    data.universes.push({ ...data.universes[0]!, id: 'another-universe' });
    data.entities[0]!.universeId = 'another-universe';
    data.events[0]!.time = {
      kind: 'exact',
      system: 'missing-system',
      value: 0,
      label: 'Sintético',
    };
    const messages = findIntegrityIssues(data)
      .map((issue) => issue.message)
      .join('\n');
    expect(messages).toMatch(/entre universos/);
    expect(messages).toMatch(/Sistema temporal inexistente/);
  });
  it('requires evidence for reviewed events and causal relations', () => {
    const data = copy();
    data.events[0]!.editorialStatus = 'reviewed';
    data.events[0]!.evidence = [];
    data.relations[0]!.kind = 'causes';
    data.relations[0]!.directed = true;
    expect(DatasetSchema.safeParse(data).success).toBe(false);
    expect(
      findIntegrityIssues(data).some((issue) =>
        /contenido real/.test(issue.message),
      ),
    ).toBe(true);
  });
  it('allows narrative cycles but rejects strict precedence cycles across time and relations', () => {
    const data = copy();
    data.relations.push({
      ...data.relations[0]!,
      id: 'demo-relation-99',
      fromEventId: 'demo-event-02',
      toEventId: 'demo-event-01',
    });
    expect(findIntegrityIssues(data)).toEqual([]);
    data.events[1]!.time = {
      kind: 'relative',
      after: ['demo-event-04'],
      before: [],
    };
    expect(
      findIntegrityIssues(data).some((issue) => /Ciclo/.test(issue.message)),
    ).toBe(true);
  });
  it('preserves uncertainty and keeps revelation order independent of historical placement', () => {
    expect(fixture.events[0]!.time).toEqual({
      kind: 'unknown',
      label: 'Fecha desconocida',
    });
    expect(fixture.events[1]!.time).toMatchObject({
      kind: 'range',
      start: 12,
      end: 18,
      approximate: true,
    });
    expect(fixture.events[3]!.time).toEqual({
      kind: 'relative',
      before: [],
      after: ['demo-event-02'],
    });
    expect(fixture.events[0]!.revelation.order).toBeGreaterThan(
      fixture.events[1]!.revelation.order,
    );
    expect(fixture.events[0]!.displayOrder).toBeLessThan(
      fixture.events[1]!.displayOrder,
    );
  });
});
