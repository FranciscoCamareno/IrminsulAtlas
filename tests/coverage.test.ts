import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CoverageRegistrySchema } from '../src/domain/schema';

const registry = CoverageRegistrySchema.parse(
  JSON.parse(readFileSync('content/editorial/genshin-coverage.json', 'utf8')),
);
const unit = registry.units[0]!;

describe('coverage registry', () => {
  it('keeps the committed inventory valid with unique ids and an explicit cut-off check', () => {
    expect(registry.units.length).toBeGreaterThan(0);
    expect(registry.publicCutoff.verification).not.toBe('official');
  });
  it('rejects duplicate ids', () => {
    expect(
      CoverageRegistrySchema.safeParse({
        ...registry,
        units: [unit, unit],
      }).success,
    ).toBe(false);
  });
  it('requires events for a unit examined with events and a reason for an exclusion', () => {
    const bad = (patch: object) =>
      CoverageRegistrySchema.safeParse({
        ...registry,
        units: [{ ...unit, importStatus: 'imported', ...patch }],
      }).success;
    expect(bad({ examination: 'examined-with-events', eventIds: [] })).toBe(
      false,
    );
    expect(bad({ examination: 'excluded' })).toBe(false);
    expect(bad({ examination: 'excluded', note: 'Sin acontecimiento' })).toBe(
      true,
    );
  });
  it('does not allow an unimported unit to count as examined', () => {
    expect(
      CoverageRegistrySchema.safeParse({
        ...registry,
        units: [
          {
            ...unit,
            importStatus: 'not-imported',
            examination: 'examined-no-event',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
