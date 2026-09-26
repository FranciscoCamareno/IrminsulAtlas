import type { Dataset, Evidence, HistoricalTime } from './schema';

export interface IntegrityIssue {
  path: string;
  message: string;
}

// Dataset-wide invariants run only AFTER structural validation succeeds.
export function findIntegrityIssues(data: Dataset): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const report = (path: string, message: string) => {
    issues.push({ path, message });
  };
  const collections = {
    universes: data.universes,
    eras: data.eras,
    entities: data.entities,
    milestones: data.milestones,
    sources: data.sources,
    events: data.events,
    relations: data.relations,
  };
  const allIds = new Set<string>();
  for (const [name, items] of Object.entries(collections)) {
    items.forEach((item, i) => {
      if (allIds.has(item.id))
        report(`${name}[${i}].id`, `ID duplicado: ${item.id}`);
      allIds.add(item.id);
    });
  }
  type Target = { id: string; universeId?: string; editorialStatus: string };
  function reference(
    items: readonly Target[],
    id: string,
    owner: Target,
    path: string,
  ) {
    const target = items.find((item) => item.id === id);
    if (!target) {
      report(path, `Referencia inexistente: ${id}`);
      return;
    }
    if (target.universeId && owner.universeId !== target.universeId)
      report(path, 'Referencia entre universos');
    if (owner.editorialStatus !== 'demo' && target.editorialStatus === 'demo')
      report(path, 'El contenido real no puede depender de demostración');
  }
  function requirements(
    owner: Target,
    values: readonly string[],
    path: string,
  ) {
    values.forEach((id, i) =>
      reference(data.milestones, id, owner, `${path}[${i}]`),
    );
  }
  function evidence(owner: Target, values: readonly Evidence[], path: string) {
    values.forEach((item, i) => {
      reference(data.sources, item.sourceId, owner, `${path}[${i}].sourceId`);
      requirements(
        owner,
        item.spoilerRequirements,
        `${path}[${i}].spoilerRequirements`,
      );
    });
  }
  const edges = new Map<string, Set<string>>(
    data.events.map((event) => [event.id, new Set<string>()]),
  );
  const addEdge = (from: string, to: string) => {
    edges.get(from)?.add(to);
  };
  function temporal(
    owner: Target,
    time: HistoricalTime,
    path: string,
    eventId?: string,
  ) {
    if ('system' in time) {
      const universe = data.universes.find(
        (item) => item.id === owner.universeId,
      );
      if (
        universe &&
        !universe.temporalSystems.some((system) => system.id === time.system)
      )
        report(`${path}.system`, 'Sistema temporal inexistente en el universo');
    }
    if (time.kind === 'relative') {
      for (const direction of ['before', 'after'] as const) {
        time[direction].forEach((id, i) => {
          reference(data.events, id, owner, `${path}.${direction}[${i}]`);
          if (eventId) {
            if (direction === 'before') addEdge(eventId, id);
            else addEdge(id, eventId);
          }
        });
      }
    }
  }
  for (const [name, items] of Object.entries(collections)) {
    items.forEach((item, i) => {
      if ('universeId' in item)
        reference(
          data.universes,
          item.universeId,
          item,
          `${name}[${i}].universeId`,
        );
      if ('spoilerRequirements' in item)
        requirements(
          item,
          item.spoilerRequirements,
          `${name}[${i}].spoilerRequirements`,
        );
    });
  }
  for (const [i, universe] of data.universes.entries()) {
    const systems = universe.temporalSystems.map((system) => system.id);
    if (new Set(systems).size !== systems.length)
      report(`universes[${i}].temporalSystems`, 'Sistema temporal duplicado');
  }
  data.eras.forEach((era, i) => {
    if (era.bounds) temporal(era, era.bounds, `eras[${i}].bounds`);
  });
  const slugs = new Set<string>();
  data.events.forEach((event, i) => {
    const path = `events[${i}]`;
    const slugKey = JSON.stringify([
      event.universeId,
      event.language,
      event.slug,
    ]);
    if (slugs.has(slugKey))
      report(`${path}.slug`, 'Slug duplicado en universo/idioma');
    slugs.add(slugKey);
    reference(data.eras, event.eraId, event, `${path}.eraId`);
    event.entityIds.forEach((id, j) =>
      reference(data.entities, id, event, `${path}.entityIds[${j}]`),
    );
    requirements(
      event,
      event.revelation.milestoneIds,
      `${path}.revelation.milestoneIds`,
    );
    evidence(event, event.evidence, `${path}.evidence`);
    temporal(event, event.time, `${path}.time`, event.id);
  });
  data.relations.forEach((relation, i) => {
    const path = `relations[${i}]`;
    reference(
      data.events,
      relation.fromEventId,
      relation,
      `${path}.fromEventId`,
    );
    reference(data.events, relation.toEventId, relation, `${path}.toEventId`);
    evidence(relation, relation.evidence, `${path}.evidence`);
    if (relation.kind === 'precedes')
      addEdge(relation.fromEventId, relation.toEventId);
  });
  const missions = new Set<string>();
  data.sources.forEach((source, i) => {
    if (source.kind !== 'mission') return;
    const key = JSON.stringify([
      source.providerId,
      source.externalId,
      source.language,
    ]);
    if (missions.has(key))
      report(
        `sources[${i}].externalId`,
        'Misión duplicada por proveedor/ID/idioma',
      );
    missions.add(key);
  });
  // Only strict precedence is acyclic. Narrative associations may form cycles.
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) {
      report(`events.${id}.time`, `Ciclo de anterioridad estricta en ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of edges.get(id) ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of edges.keys()) visit(id);
  return issues;
}
