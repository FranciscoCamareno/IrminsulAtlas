import { describe, expect, it } from 'vitest';
import {
  choiceFromSnapshot,
  isValidChoice,
  progressSet,
} from '../src/application/progress';
import { visibleView } from '../src/application/atlas';
import { buildAtlasData } from '../src/content/atlas-data';
import { composeCorpora } from '../src/content/corpora';
import { loadDossierContent } from '../src/content/dossier';

const base = await loadDossierContent();
const main = base.milestones[0]!;
const second = base.milestones[1]!;
// SYNTHETIC DEMO FIXTURE: an invented side quest gating an invented event.
const side = {
  ...structuredClone(main),
  id: 'demo-opcional',
  safeLabel: 'Misión opcional de demostración',
  track: 'optional' as const,
};
const event = {
  ...structuredClone(base.events[0]!),
  id: 'demo-evento-opcional',
  slug: 'demo-evento-opcional',
  title: 'Evento de demostración',
  aliases: [],
  entityIds: [],
  dossierSection: undefined,
  evidence: [],
  spoilerRequirements: [main.id, side.id],
};
const data = composeCorpora(base, [
  {
    schemaVersion: 1,
    corpus: 'demo-opcional',
    milestones: [side],
    eras: [],
    entities: [],
    events: [event],
    relations: [],
    evidence: { schemaVersion: 1, sources: [], claims: [] },
  },
]);
const index = buildAtlasData(data).index;
const sees = (choice: Parameters<typeof progressSet>[0]) =>
  visibleView(index, progressSet(choice, index.milestones)).events.some(
    (item) => item.id === event.id,
  );

describe('main ladder plus optional milestones', () => {
  it('shows an event needing both the act and a side quest only to the reader with both', () => {
    expect(sees({ kind: 'upto', milestoneId: main.id })).toBe(false);
    expect(
      sees({ kind: 'upto', milestoneId: main.id, optional: [side.id] }),
    ).toBe(true);
    // Same act or later, without ticking the side quest: still hidden.
    expect(sees({ kind: 'upto', milestoneId: second.id })).toBe(false);
    // The side quest alone does not open the act it depends on.
    expect(sees({ kind: 'none' })).toBe(false);
    expect(sees({ kind: 'all' })).toBe(true);
  });
  it('grants nothing for unknown ids or for main milestones passed as optional', () => {
    const set = progressSet(
      {
        kind: 'upto',
        milestoneId: main.id,
        optional: ['no-existe', second.id],
      },
      index.milestones,
    );
    expect([...set]).toEqual([main.id]);
  });
  it('does not let the ladder pass through optional milestones or accept one as the act', () => {
    expect(
      isValidChoice({ kind: 'upto', milestoneId: side.id }, index.milestones),
    ).toBe(false);
    const ladder = progressSet(
      { kind: 'upto', milestoneId: second.id },
      index.milestones,
    );
    expect(ladder.has(side.id)).toBe(false);
  });
});

describe('persisted choice format', () => {
  it('reads a v1 value with exactly the access it had, and sanitizes the optional list', () => {
    expect(
      choiceFromSnapshot(JSON.stringify({ kind: 'upto', milestoneId: 'x' })),
    ).toEqual({ kind: 'upto', milestoneId: 'x' });
    expect(
      choiceFromSnapshot(
        JSON.stringify({
          kind: 'upto',
          milestoneId: 'x',
          optional: ['a', 'a', 3, null],
        }),
      ),
    ).toEqual({ kind: 'upto', milestoneId: 'x', optional: ['a'] });
    expect(choiceFromSnapshot('{"kind":"upto"}')).toBeNull();
    expect(choiceFromSnapshot('not json')).toBeNull();
  });
});
