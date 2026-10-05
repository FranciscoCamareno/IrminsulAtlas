import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  EvidenceRegistrySchema,
  type ImportedDataset,
} from '../src/domain/schema';
import { buildImpactReport } from '../src/domain/impact';

const registry = EvidenceRegistrySchema.parse(
  JSON.parse(await readFile('content/editorial/genshin-evidence.json', 'utf8')),
);
// An import that matches every pinned fragment, built from the registry itself.
function matching() {
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
          .filter((s) => s.sourceId === source.id && s.fragment)
          .map((s) => ({
            id: s.fragment!.segmentId,
            text: {
              status: 'available',
              sha256: s.fragment!.sha256,
              value: 'x',
            },
          })),
      ),
    })),
  } as unknown as ImportedDataset;
}
// The first claim with a verified fragment, and the source it leans on.
const claim = registry.claims.find((c) => c.support.some((s) => s.fragment))!;
const support = claim.support.find((s) => s.fragment)!;
const imported = registry.sources.find(
  (s) => s.id === support.sourceId && s.kind === 'imported',
)!;
const relations = [
  { id: 'rel-afectada', claimIds: [claim.id] },
  { id: 'rel-ajena', claimIds: ['claim-inexistente'] },
];
const impact = (candidate: ImportedDataset) =>
  buildImpactReport([registry], relations, candidate);

describe('editorial impact of a candidate import', () => {
  it('reports no impact for an update that changes nothing the evidence cites', () => {
    const report = impact(matching());
    expect(report.affectedClaims).toEqual([]);
    expect(report.needsReview).toEqual([]);
    expect(report.snapshotChanged).toBe(false);
    expect(report.unaffectedClaims).toBe(registry.claims.length);
  });
  it('follows a changed segment to its claims, events and relations', () => {
    const candidate = matching();
    const segment = candidate.sources
      .flatMap((s) => s.segments)
      .find((s) => s.id === support.fragment!.segmentId)!;
    segment.text = { ...segment.text, sha256: 'c'.repeat(64) } as never;
    const report = impact(candidate);
    const hit = report.affectedClaims.find((c) => c.claimId === claim.id)!;
    expect(hit.reasons.map((r) => r.code)).toContain('fragment-changed');
    expect(hit.eventIds).toEqual([...claim.eventIds].sort());
    expect(hit.relationIds).toEqual(['rel-afectada']);
    expect(report.affectedRelations).toEqual(['rel-afectada']);
    expect(report.needsReview).toContain(claim.id);
    // Only claims leaning on that fragment are touched.
    expect(report.unaffectedClaims).toBeGreaterThan(0);
  });
  it('flags every claim of a withdrawn source, and keeps a reviewed claim on the review list', () => {
    const candidate = matching();
    candidate.sources = candidate.sources.filter(
      (s) => s.id !== (imported as { importedId: string }).importedId,
    );
    const claimsOfSource = registry.claims.filter((c) =>
      c.support.some((s) => s.sourceId === imported.id),
    );
    const report = impact(candidate);
    expect(report.needsReview.sort()).toEqual(
      claimsOfSource.map((c) => c.id).sort(),
    );
    const reviewed = {
      ...registry,
      claims: registry.claims.map((c) =>
        c.id === claim.id
          ? {
              ...c,
              review: {
                status: 'reviewed' as const,
                reviewer: 'x',
                date: '2026-01-01',
              },
            }
          : c,
      ),
    };
    const again = buildImpactReport([reviewed], relations, candidate);
    expect(
      again.affectedClaims.find((c) => c.claimId === claim.id)!.reviewStatus,
    ).toBe('reviewed');
    expect(again.needsReview).toContain(claim.id);
  });
  it('treats a new provider commit as a notice, not as invalidating every claim', () => {
    const candidate = matching();
    candidate.snapshot = { ...candidate.snapshot, commit: 'f'.repeat(40) };
    const report = impact(candidate);
    expect(report.snapshotChanged).toBe(true);
    expect(report.affectedClaims).toEqual([]);
  });
});
