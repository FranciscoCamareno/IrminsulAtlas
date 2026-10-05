import type { DossierMap, EvidenceRegistry, ImportedDataset } from './schema';

export interface RegistryIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
}

// Approving a claim never implicitly approves its whole card or a relationship.
// The dossier has its own explicit review decision, backed by reviewed claims.
export function findDossierReviewIssues(
  mapping: DossierMap,
  registry: EvidenceRegistry,
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const claims = new Map(registry.claims.map((claim) => [claim.id, claim]));
  const add = (code: string, path: string, message: string) =>
    issues.push({ severity: 'error', code, path, message });
  for (const item of [...mapping.events, ...mapping.relations]) {
    if (item.editorialStatus !== 'reviewed') continue;
    if (!item.review)
      add(
        'dossier-review-incomplete',
        item.id,
        'Una ficha revisada necesita responsable y fecha',
      );
    const selected =
      'claimIds' in item
        ? item.claimIds.flatMap((id) =>
            claims.get(id) ? [claims.get(id)!] : [],
          )
        : registry.claims.filter((claim) => claim.eventIds.includes(item.id));
    if (!selected.length)
      add(
        'dossier-review-without-claims',
        item.id,
        'Una ficha revisada necesita afirmaciones revisadas',
      );
    if (selected.some((claim) => claim.review.status !== 'reviewed'))
      add(
        'dossier-review-with-pending-claims',
        item.id,
        'La ficha contiene afirmaciones pendientes o discutidas',
      );
    if ('claimIds' in item) {
      for (const eventId of [item.fromEventId, item.toEventId])
        if (!selected.some((claim) => claim.eventIds.includes(eventId)))
          add(
            'relation-review-without-endpoint',
            item.id,
            'Las afirmaciones deben cubrir ambos acontecimientos de la relación',
          );
    }
  }
  for (const relation of mapping.relations) {
    for (const id of relation.claimIds) {
      const claim = claims.get(id);
      if (!claim)
        add(
          'unknown-relation-claim',
          relation.id,
          `Afirmación inexistente: ${id}`,
        );
      else if (
        !claim.eventIds.some((eventId) =>
          [relation.fromEventId, relation.toEventId].includes(eventId),
        )
      )
        add(
          'unrelated-relation-claim',
          relation.id,
          `Afirmación ajena a la relación: ${id}`,
        );
    }
  }
  return issues;
}

// Structural checks: they need no imported text, so they run on every load and
// on a clean checkout. Anything broken or incomplete is reported with its path.
export function findRegistryIssues(
  registry: EvidenceRegistry,
  eventIds: ReadonlySet<string>,
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const add = (
    severity: RegistryIssue['severity'],
    code: string,
    path: string,
    message: string,
  ) => issues.push({ severity, code, path, message });
  const sources = new Map<string, EvidenceRegistry['sources'][number]>();
  registry.sources.forEach((source, i) => {
    if (sources.has(source.id))
      add(
        'error',
        'duplicate-source',
        `sources[${i}].id`,
        `ID duplicado: ${source.id}`,
      );
    sources.set(source.id, source);
  });
  const claimIds = new Set<string>();
  const used = new Set<string>();
  registry.claims.forEach((claim, i) => {
    const at = `claims[${i}] (${claim.id})`;
    if (claimIds.has(claim.id))
      add('error', 'duplicate-claim', at, `ID duplicado: ${claim.id}`);
    claimIds.add(claim.id);
    for (const id of claim.eventIds)
      if (!eventIds.has(id))
        add('error', 'unknown-event', at, `Evento inexistente: ${id}`);
    if (
      (claim.kind === 'explicit' || claim.kind === 'testimony') &&
      claim.support.length === 0
    )
      add(
        'error',
        'claim-without-support',
        at,
        'Una afirmación explícita o un testimonio necesita al menos una fuente',
      );
    claim.support.forEach((support, j) => {
      const where = `${at}.support[${j}]`;
      const source = sources.get(support.sourceId);
      if (!source) {
        add(
          'error',
          'unknown-source',
          where,
          `Fuente inexistente: ${support.sourceId}`,
        );
        return;
      }
      used.add(source.id);
      if (source.kind === 'imported' && !support.fragment)
        add(
          'error',
          'imported-support-without-fragment',
          where,
          'Una fuente importada exige segmento y hash del fragmento',
        );
      if (source.kind === 'external' && support.fragment)
        add(
          'error',
          'fragment-on-external-source',
          where,
          'Solo las fuentes importadas se fijan por fragmento',
        );
      if (
        support.verification === 'verified' &&
        source.kind === 'external' &&
        !source.accessedAt
      )
        add(
          'error',
          'verified-without-access-date',
          where,
          'Una fuente externa contrastada necesita fecha de consulta',
        );
    });
    if (claim.review.status === 'reviewed') {
      if (!claim.review.reviewer || !claim.review.date)
        add(
          'error',
          'review-incomplete',
          at,
          'Una revisión necesita responsable y fecha',
        );
      if (
        (claim.kind === 'explicit' || claim.kind === 'testimony') &&
        !claim.support.some((support) => support.verification === 'verified')
      )
        add(
          'error',
          'reviewed-without-verified-support',
          at,
          'No puede darse por revisada una afirmación sin ningún respaldo contrastado',
        );
    }
  });
  for (const source of registry.sources)
    if (!used.has(source.id))
      add(
        'warning',
        'unused-source',
        `sources (${source.id})`,
        'Fuente que ninguna afirmación utiliza',
      );
  return issues;
}

// Text-level checks against a promoted import. Without an accepted import they
// cannot run, which the caller must report: it is not a pass.
export function verifyAgainstImport(
  registry: EvidenceRegistry,
  imported: ImportedDataset,
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const add = (code: string, path: string, message: string) =>
    issues.push({ severity: 'error', code, path, message });
  const byId = new Map(imported.sources.map((source) => [source.id, source]));
  const sources = new Map(
    registry.sources.map((source) => [source.id, source]),
  );
  for (const source of registry.sources) {
    if (source.kind !== 'imported') continue;
    const record = byId.get(source.importedId);
    if (!record) {
      add(
        'missing-imported-source',
        source.id,
        `La fuente ${source.importedId} no está en la importación aceptada`,
      );
      continue;
    }
    if (source.snapshotCommit !== imported.snapshot.commit)
      add(
        'snapshot-changed',
        source.id,
        'La importación aceptada procede de otro commit del proveedor',
      );
    if (
      source.locator.path !== record.locator.path ||
      source.locator.pointer !== record.locator.pointer ||
      source.locator.fileSha256 !== record.locator.fileSha256
    )
      add(
        'locator-changed',
        source.id,
        'El localizador de la fuente ya no coincide con la importación',
      );
  }
  for (const claim of registry.claims)
    claim.support.forEach((support, j) => {
      const source = sources.get(support.sourceId);
      if (source?.kind !== 'imported' || !support.fragment) return;
      const where = `${claim.id}.support[${j}]`;
      const record = byId.get(source.importedId);
      const segment = record?.segments.find(
        (item) => item.id === support.fragment!.segmentId,
      );
      if (!segment) {
        add(
          'missing-segment',
          where,
          `Segmento inexistente: ${support.fragment.segmentId}`,
        );
        return;
      }
      if (segment.text.status !== 'available')
        add(
          'segment-without-text',
          where,
          'El segmento no tiene texto importado',
        );
      else if (segment.text.sha256 !== support.fragment.sha256)
        add(
          'fragment-changed',
          where,
          'El texto del fragmento cambió desde su revisión',
        );
    });
  return issues;
}
