import { describe, expect, it } from 'vitest';
import { loadAtlasContent, loadCorpusFiles } from '../src/content/corpora';
import { buildAtlasData } from '../src/content/atlas-data';
import { visibleView } from '../src/application/atlas';
import { progressSet } from '../src/application/progress';

const data = await loadAtlasContent();
const [traveler] = await loadCorpusFiles();
const index = buildAtlasData(data).index;
const view = (milestoneId: string) =>
  visibleView(
    index,
    progressSet({ kind: 'upto', milestoneId }, index.milestones),
  );
const travelerIds = new Set(traveler!.events.map((event) => event.id));

describe('Traveler corpus', () => {
  it('composes with the ancient dossier and keeps every claim pending and pinned', () => {
    expect(traveler!.corpus).toBe('viajero');
    expect(traveler!.events.length).toBeGreaterThanOrEqual(45);
    const sources = new Set(traveler!.evidence.sources.map((s) => s.id));
    for (const claim of traveler!.evidence.claims) {
      expect(claim.review.status).toBe('pending');
      expect(claim.eventIds.every((id) => travelerIds.has(id))).toBe(true);
      for (const support of claim.support) {
        expect(sources.has(support.sourceId)).toBe(true);
        expect(support.fragment?.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(support.verification).toBe('cited');
      }
    }
  });
  it('interleaves the acts with the regional ladder of the ancient dossier', () => {
    const ladder = index.milestones
      .filter((m) => m.track === 'main')
      .map((m) => m.id);
    expect(ladder[0]).toBe('hito-v-1001');
    expect(ladder.indexOf('hito-mondstadt')).toBeGreaterThan(
      ladder.indexOf('hito-v-1002'),
    );
    expect(ladder.indexOf('hito-liyue')).toBeGreaterThan(
      ladder.indexOf('hito-v-1101'),
    );
  });
  it('opens one act at a time and no ancient chapter before the end of Mondstadt', () => {
    const first = view('hito-v-1001');
    expect(first.events.map((event) => event.id)).toEqual(['evt-viajero-1001']);
    const second = view('hito-v-1002').events.map((event) => event.id);
    expect(second).toContain('evt-viajero-1002');
    expect(second.some((id) => !travelerIds.has(id))).toBe(false);
    const mondstadt = view('hito-mondstadt').events.map((event) => event.id);
    expect(mondstadt).toContain('evt-viajero-1003');
    expect(mondstadt).toContain('evt-rebelion-decarabian');
    expect(mondstadt).not.toContain('evt-viajero-1101');
  });
  it('gates recurring characters by their first act and never shows a later one early', () => {
    const early = new Set(view('hito-v-1001').entities.map((e) => e.id));
    for (const entity of traveler!.entities) {
      const first = entity.spoilerRequirements[0]!;
      if (first !== 'hito-v-1001') expect(early.has(entity.id)).toBe(false);
    }
  });
  it('stores plain prose without markup', () => {
    for (const event of traveler!.events) {
      expect(event.body).not.toMatch(/<\/?[a-z]/i);
      expect(event.body.split(/\s+/).length).toBeGreaterThan(400);
    }
  });
});
