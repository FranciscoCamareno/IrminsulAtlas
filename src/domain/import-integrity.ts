import type {
  ImportedDataset,
  ImportIssue,
  ImportSelection,
  SourceLocator,
} from './schema.ts';

// Pure reference validation. Hashing, acquisition and filesystem operations stay outside.
export function findImportIssues(
  data: ImportedDataset,
  exclusions: ImportSelection['exclusions'],
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const globalIds = new Set<string>();
  const excluded = new Set(exclusions.map((item) => item.sourceId));
  const report = (
    code: string,
    file: string,
    field: string,
    id: string | null,
    message: string,
    category: string,
    severity: ImportIssue['severity'] = 'error',
  ) => {
    issues.push({ code, file, field, id, message, category, severity });
  };
  if (excluded.size !== exclusions.length)
    report(
      'DUPLICATE_ID',
      'selection',
      'exclusions',
      null,
      'Exclusión duplicada',
      'selection',
    );
  for (const item of exclusions) {
    if (!data.sources.some((source) => source.id === item.sourceId))
      report(
        'INVALID_REFERENCE',
        'selection',
        'exclusions',
        item.sourceId,
        'La exclusión no corresponde a una fuente procesada',
        'selection',
      );
  }
  const locator = (value: SourceLocator, id: string, category: string) => {
    const file = data.snapshot.files.find((entry) => entry.path === value.path);
    if (!file || file.sha256 !== value.fileSha256)
      report(
        'INVALID_PROVENANCE',
        value.path,
        value.pointer,
        id,
        'Localizador sin archivo/hash del manifiesto',
        category,
      );
  };
  const identity = (id: string, file: string, category: string) => {
    if (globalIds.has(id))
      report(
        'DUPLICATE_ID',
        file,
        'id',
        id,
        'ID normalizado duplicado',
        category,
      );
    globalIds.add(id);
  };
  for (const source of data.sources) {
    const category = source.kind;
    const coverageSeverity =
      excluded.has(source.id) || source.incomplete?.length
        ? 'warning'
        : 'error';
    identity(source.id, source.locator.path, category);
    locator(source.locator, source.id, category);
    source.metadataLocators.forEach((item) =>
      locator(item, source.id, category),
    );
    const segments = new Map(
      source.segments.map((segment) => [segment.id, segment]),
    );
    for (const conversation of source.conversations) {
      identity(conversation.id, conversation.locator.path, category);
      locator(conversation.locator, conversation.id, category);
      if (!conversation.rootSegmentId) {
        report(
          'UNKNOWN_ROOT',
          conversation.locator.path,
          'rootSegmentId',
          conversation.id,
          'Raíz no verificada: conservar fuera del conjunto aceptado',
          category,
          coverageSeverity,
        );
      } else {
        const root = segments.get(conversation.rootSegmentId);
        if (!root || root.locator.path !== conversation.locator.path)
          report(
            'DANGLING_ROOT',
            conversation.locator.path,
            'rootSegmentId',
            conversation.id,
            'Raíz inexistente o de otra conversación',
            category,
            coverageSeverity,
          );
      }
    }
    for (const segment of source.segments) {
      identity(segment.id, segment.locator.path, category);
      locator(segment.locator, segment.id, category);
      if (segment.text.status === 'missing')
        report(
          'MISSING_TEXT',
          segment.locator.path,
          segment.locator.pointer,
          segment.externalId,
          `Hash ${segment.text.textMapHash ?? 'desconocido'}: ${segment.text.reason}`,
          category,
          coverageSeverity,
        );
      else if (segment.text.status === 'available')
        locator(segment.text.origin, segment.id, category);
      for (const next of segment.nextSegmentIds) {
        const target = segments.get(next);
        if (!target || target.locator.path !== segment.locator.path)
          report(
            'DANGLING_SEGMENT',
            segment.locator.path,
            segment.locator.pointer,
            segment.externalId,
            `Destino inválido: ${next}`,
            category,
            coverageSeverity,
          );
      }
    }
    if (excluded.has(source.id))
      report(
        'EXCLUDED_SOURCE',
        source.locator.path,
        '',
        source.id,
        exclusions.find((item) => item.sourceId === source.id)!.reason,
        category,
        'warning',
      );
  }
  return issues;
}
