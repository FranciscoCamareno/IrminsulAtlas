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

// Faithful stand-in for a promoted import, built from what the registry pins:
// every imported source with every segment (and hash) its claims rely on.
function standIn() {
  const sources = registry.sources.flatMap((source) =>
    source.kind === 'imported' ? [source] : [],
  );
  return {
    snapshot: { commit: sources[0]!.snapshotCommit },
    sources: sources.map((source) => ({
      id: source.importedId,
      locator: structuredClone(source.locator),
      segments: registry.claims.flatMap((claim) =>
        claim.support
          .filter(
            (support) => support.sourceId === source.id && support.fragment,
          )
          .map((support) => ({
            id: support.fragment!.segmentId,
            text: {
              status: 'available',
              sha256: support.fragment!.sha256,
              value: 'x',
            },
          })),
      ),
    })),
  } as unknown as ImportedDataset;
}
const codesOf = (imported: ImportedDataset) =>
  verifyAgainstImport(registry, imported).map((issue) => issue.code);

describe('verification against an accepted import', () => {
  it('passes when sources, locators and fragment hashes are unchanged', () => {
    expect(verifyAgainstImport(registry, standIn())).toEqual([]);
  });
  it('detects a changed fragment, a missing segment or source, a moved locator and another snapshot', () => {
    const changed = standIn();
    changed.sources[0]!.segments[0]!.text = {
      ...changed.sources[0]!.segments[0]!.text,
      sha256: 'b'.repeat(64),
    } as never;
    expect(codesOf(changed)).toContain('fragment-changed');
    const noSegment = standIn();
    noSegment.sources[0]!.segments = [];
    expect(codesOf(noSegment)).toContain('missing-segment');
    const noSource = standIn();
    noSource.sources = noSource.sources.slice(1);
    expect(codesOf(noSource)).toContain('missing-imported-source');
    const moved = standIn();
    moved.sources[0]!.locator = {
      ...moved.sources[0]!.locator,
      fileSha256: 'c'.repeat(64),
    };
    expect(codesOf(moved)).toContain('locator-changed');
    const other = standIn();
    other.snapshot = { ...other.snapshot, commit: 'd'.repeat(40) };
    expect(codesOf(other)).toContain('snapshot-changed');
    const noText = standIn();
    noText.sources[0]!.segments[0]!.text = {
      status: 'missing',
      textMapHash: null,
      reason: 'x',
    };
    expect(codesOf(noText)).toContain('segment-without-text');
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
