import type { EvidenceRegistry, ImportedDataset } from './schema.ts';
import { verifyAgainstImport } from './evidence-integrity.ts';

export interface ImpactReport {
  // The provider commit differs from the one the evidence was reviewed against.
  // Informational: it does not by itself invalidate any claim.
  snapshotChanged: boolean;
  affectedClaims: {
    claimId: string;
    reviewStatus: 'pending' | 'reviewed' | 'disputed';
    eventIds: string[];
    relationIds: string[];
    reasons: { code: string; where: string }[];
  }[];
  affectedEvents: string[];
  affectedRelations: string[];
  // Every affected claim needs a person's review; a reviewed one is reopened
  // by this list, never silently kept as approved.
  needsReview: string[];
  unaffectedClaims: number;
}

// Source/segment → claims → events and relations. It reads the evidence
// registries against a candidate import and changes nothing.
export function buildImpactReport(
  registries: readonly EvidenceRegistry[],
  relations: readonly { id: string; claimIds: readonly string[] }[],
  candidate: ImportedDataset,
): ImpactReport {
  const reasonsByClaim = new Map<string, { code: string; where: string }[]>();
  const add = (claimId: string, code: string, where: string) =>
    reasonsByClaim.set(claimId, [
      ...(reasonsByClaim.get(claimId) ?? []),
      { code, where },
    ]);
  let snapshotChanged = false;
  for (const registry of registries) {
    for (const issue of verifyAgainstImport(registry, candidate)) {
      if (issue.code === 'snapshot-changed') {
        snapshotChanged = true;
        continue;
      }
      // Source-level issues carry the registry source id; claim-level ones
      // start with the claim id.
      const claimsOfSource = registry.claims.filter((claim) =>
        claim.support.some((support) => support.sourceId === issue.path),
      );
      if (claimsOfSource.length)
        for (const claim of claimsOfSource)
          add(claim.id, issue.code, issue.path);
      else add(issue.path.split('.support[')[0]!, issue.code, issue.path);
    }
  }
  const claims = registries.flatMap((registry) => registry.claims);
  const affectedClaims = claims
    .filter((claim) => reasonsByClaim.has(claim.id))
    .map((claim) => ({
      claimId: claim.id,
      reviewStatus: claim.review.status,
      eventIds: [...claim.eventIds].sort(),
      relationIds: relations
        .filter((relation) => relation.claimIds.includes(claim.id))
        .map((relation) => relation.id)
        .sort(),
      reasons: reasonsByClaim.get(claim.id)!,
    }));
  const unique = (items: string[]) => [...new Set(items)].sort();
  return {
    snapshotChanged,
    affectedClaims,
    affectedEvents: unique(affectedClaims.flatMap((claim) => claim.eventIds)),
    affectedRelations: unique(
      affectedClaims.flatMap((claim) => claim.relationIds),
    ),
    needsReview: affectedClaims.map((claim) => claim.claimId).sort(),
    unaffectedClaims: claims.length - affectedClaims.length,
  };
}
