import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { loadDossierContent } from '../src/content/dossier';
import { buildAtlasData } from '../src/content/atlas-data';
import {
  EvidenceRegistrySchema,
  type EvidenceRegistry,
  type ImportedDataset,
} from '../src/domain/schema';
import {
  findRegistryIssues,
  verifyAgainstImport,
} from '../src/domain/evidence-integrity';
import { assembleEvent, visibleView } from '../src/application/atlas';
import { progressSet } from '../src/application/progress';

const dataset = await loadDossierContent();
const atlas = buildAtlasData(dataset);
const registry = EvidenceRegistrySchema.parse(
  JSON.parse(await readFile('content/editorial/genshin-evidence.json', 'utf8')),
);
const eventIds = new Set(dataset.events.map((event) => event.id));
const clone = () => structuredClone(registry);
const codes = (value: EvidenceRegistry, ids = eventIds) =>
  findRegistryIssues(value, ids)
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.code);

describe('evidence registry', () => {
  it('is structurally complete: no broken or incomplete reference', () => {
    expect(findRegistryIssues(registry, eventIds)).toEqual([]);
  });
  it('lets one source back several claims and events, and one event have several sources', () => {
    const uses = new Map<string, Set<string>>();
    for (const claim of registry.claims)
      for (const support of claim.support)
        uses.set(
          support.sourceId,
          (uses.get(support.sourceId) ?? new Set()).add(claim.id),
        );
    expect(
      Math.max(...[...uses.values()].map((set) => set.size)),
    ).toBeGreaterThan(1);
    expect(registry.claims.some((claim) => claim.eventIds.length > 1)).toBe(
      true,
    );
    const vennessa = registry.claims.filter((claim) =>
      claim.eventIds.includes('evt-revolucion-vennessa'),
    );
    const sourcesOfEvent = new Set(
      vennessa.flatMap((claim) => claim.support.map((s) => s.sourceId)),
    );
    expect(sourcesOfEvent.size).toBeGreaterThan(1);
  });
  it('only claims a verified fragment where the primary text was actually compared', () => {
    const verified = registry.claims.flatMap((claim) =>
      claim.support.filter((support) => support.verification === 'verified'),
    );
    expect(verified.length).toBeGreaterThan(0);
    for (const support of verified) {
      const source = registry.sources.find(
        (item) => item.id === support.sourceId,
      )!;
      expect(source.kind).toBe('imported');
      expect(support.fragment?.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    // The dossier's own external citations were not re-read in this review.
    for (const claim of registry.claims)
      for (const support of claim.support)
        if (
          registry.sources.find((s) => s.id === support.sourceId)!.kind ===
          'external'
        )
          expect(support.verification).toBe('cited');
  });
  it('detects broken and incomplete references', () => {
    const broken = clone();
    broken.claims[0]!.eventIds = ['evt-inexistente'];
    broken.claims[1]!.support[0]!.sourceId = 'src-inexistente';
    broken.claims[2]!.support = [];
    broken.claims[3]!.support[0]!.fragment = undefined as never;
    broken.claims.push({ ...structuredClone(broken.claims[4]!) });
    expect(codes(broken)).toEqual(
      expect.arrayContaining([
        'unknown-event',
        'unknown-source',
        'claim-without-support',
        'imported-support-without-fragment',
        'duplicate-claim',
      ]),
    );
    const external = clone();
    const cited = external.claims
      .flatMap((claim) => claim.support)
      .find((support) => support.sourceId.startsWith('ext-'))!;
    cited.verification = 'verified';
    expect(codes(external)).toContain('verified-without-access-date');
    cited.fragment = { segmentId: 'x', sha256: 'a'.repeat(64) };
    expect(codes(external)).toContain('fragment-on-external-source');
    const reviewed = clone();
    const open = reviewed.claims.find(
      (claim) =>
        claim.kind === 'explicit' &&
        claim.support.every((s) => s.verification === 'cited'),
    )!;
    open.review = { status: 'reviewed' };
    expect(codes(reviewed)).toEqual(
      expect.arrayContaining([
        'review-incomplete',
        'reviewed-without-verified-support',
      ]),
    );
    const unused = clone();
    unused.sources.push({
      kind: 'external',
      id: 'ext-sin-uso',
      title: 'Sin uso',
      url: 'https://example.org/',
      tier: 'secondary',
    });
    expect(findRegistryIssues(unused, eventIds).map((i) => i.code)).toContain(
      'unused-source',
    );
    const twice = clone();
    twice.sources.push(structuredClone(twice.sources[0]!));
    expect(codes(twice)).toContain('duplicate-source');
  });
  it('keeps open questions and interpretations that cite no source, without presenting them as data', () => {
    const open = registry.claims.filter((claim) => claim.kind === 'unknown');
    expect(open.length).toBeGreaterThan(0);
    for (const claim of registry.claims.filter(
      (c) => c.kind === 'unknown' || c.kind === 'interpretation',
    ))
      expect(claim.review.status).not.toBe('reviewed');
  });
});

// Minimal stand-in for a promoted import: only what verification reads.
function importWith(text: string, overrides: Record<string, unknown> = {}) {
  const source = registry.sources.find((item) => item.kind === 'imported')!;
  if (source.kind !== 'imported') throw new Error('unreachable');
  const claim = registry.claims.find((item) =>
    item.support.some((s) => s.fragment),
  )!;
  const fragment = claim.support.find((s) => s.fragment)!.fragment!;
  return {
    snapshot: { commit: source.snapshotCommit },
    sources: [
      {
        id: source.importedId,
        locator: source.locator,
        segments: [
          {
            id: fragment.segmentId,
            text: { status: 'available', sha256: text, value: 'x' },
          },
        ],
        ...overrides,
      },
    ],
  } as unknown as ImportedDataset;
}
const pinned = registry.claims
  .flatMap((claim) => claim.support)
  .find((s) => s.fragment)!.fragment!.sha256;

describe('verification against an accepted import', () => {
  it('passes when sources, locators and fragment hashes are unchanged', () => {
    expect(verifyAgainstImport(registry, importWith(pinned))).toEqual([]);
  });
  it('detects a changed fragment, a missing segment or source, a moved locator and another snapshot', () => {
    expect(
      verifyAgainstImport(registry, importWith('b'.repeat(64))).map(
        (i) => i.code,
      ),
    ).toContain('fragment-changed');
    expect(
      verifyAgainstImport(registry, importWith(pinned, { segments: [] })).map(
        (i) => i.code,
      ),
    ).toContain('missing-segment');
    const noSource = importWith(pinned);
    noSource.sources = [];
    expect(
      verifyAgainstImport(registry, noSource).map((i) => i.code),
    ).toContain('missing-imported-source');
    const moved = importWith(pinned);
    moved.sources[0]!.locator = {
      ...moved.sources[0]!.locator,
      fileSha256: 'c'.repeat(64),
    };
    expect(verifyAgainstImport(registry, moved).map((i) => i.code)).toContain(
      'locator-changed',
    );
    const other = importWith(pinned);
    other.snapshot = { ...other.snapshot, commit: 'd'.repeat(40) };
    expect(verifyAgainstImport(registry, other).map((i) => i.code)).toContain(
      'snapshot-changed',
    );
    const noText = importWith(pinned);
    noText.sources[0]!.segments[0]!.text = {
      status: 'missing',
      textMapHash: null,
      reason: 'x',
    };
    expect(verifyAgainstImport(registry, noText).map((i) => i.code)).toContain(
      'segment-without-text',
    );
  });
});

describe('claims reach the reader without leaking', () => {
  const at = (milestoneId: string) =>
    visibleView(
      atlas.index,
      progressSet({ kind: 'upto', milestoneId }, atlas.index.milestones),
    );
  it('puts every claim of an event in its detail file, resolved to titles and links', () => {
    const detail = atlas.events.get('evt-revolucion-vennessa')!;
    expect(detail.claims.length).toBeGreaterThanOrEqual(6);
    const verified = detail.claims
      .flatMap((claim) => claim.supports)
      .filter((s) => s.verification === 'verified');
    expect(verified.every((s) => s.tier === 'primary' && s.fragmentId)).toBe(
      true,
    );
    expect(
      detail.claims.every((claim) =>
        claim.supports.every((s) => s.sourceTitle),
      ),
    ).toBe(true);
  });
  it('hides a claim that also concerns an event the reader cannot see yet', () => {
    // «periodo» concerns Enkanomiya (Inazuma) and the Seven (Natlan).
    const view = at('hito-inazuma');
    expect(view.eventById.has('evt-enkanomiya-watatsumi')).toBe(true);
    expect(view.eventById.has('evt-era-siete')).toBe(false);
    const detail = assembleEvent(
      view,
      atlas.events.get('evt-enkanomiya-watatsumi')!,
    )!;
    const ids = (detail.claims ?? []).map((claim) => claim.id);
    expect(ids).toContain('claim-enkanomiya-byakuyakoku');
    expect(ids).not.toContain('claim-enkanomiya-periodo');
    const full = assembleEvent(
      at('hito-natlan'),
      atlas.events.get('evt-enkanomiya-watatsumi')!,
    )!;
    expect((full.claims ?? []).map((claim) => claim.id)).toContain(
      'claim-enkanomiya-periodo',
    );
  });
});
