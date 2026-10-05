import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  loadDossierContent,
  loadDossierDocuments,
  extractDossierSections,
} from '../src/content/dossier';
import { DatasetSchema, RevelationMapSchema } from '../src/domain/schema';
import { isRelationVisible } from '../src/domain/visibility';
import { findIntegrityIssues } from '../src/domain/integrity';
import {
  getEntityById,
  getEventById,
  getVisibleTimeline,
  listVisibleEvents,
} from '../src/application/catalog';
import { layoutTimeline } from '../src/visualization/layout';
import DossierText from '../src/components/DossierText';

const data = await loadDossierContent();
const documents = await loadDossierDocuments();
const sections = documents.flatMap((document) =>
  extractDossierSections(document.body),
);
const none = new Set<string>();
const all = new Set(data.milestones.map((milestone) => milestone.id));

describe('dossier integration', () => {
  it('preserves every supplied event and entity ID and the full section prose', () => {
    for (const section of sections) {
      if (section.id.startsWith('evt-'))
        expect(data.events.find((event) => event.id === section.id)?.body).toBe(
          section.body,
        );
      else
        expect(
          data.entities.find((entity) => entity.id === section.id)?.body,
        ).toBe(section.body);
    }
    for (const event of data.events) {
      expect(event.body).toBe(
        sections.find((section) => section.id === event.dossierSection)?.body,
      );
      expect(event.evidence.length).toBeGreaterThan(0);
    }
    expect(data.entities.some((entity) => entity.id === 'per-vedrfolnir')).toBe(
      true,
    );
    expect(
      data.entities.some((entity) => entity.id === 'per-vindagnyr-testigos'),
    ).toBe(true);
    expect(findIntegrityIssues(data)).toEqual([]);
  });
  it('classifies every event and entity by revelation, never by default-visible, and never from historical order', () => {
    expect(
      data.events.every((event) => event.editorialStatus === 'provisional'),
    ).toBe(true);
    expect(data.universes.map((universe) => universe.id)).toEqual(['genshin']);
    expect(data.sources.some((source) => source.kind === 'mission')).toBe(
      false,
    );
    for (const item of [...data.events, ...data.entities])
      expect(item.spoilerRequirements).toHaveLength(1);
    // Nothing is visible before the reader declares any progress...
    expect(listVisibleEvents(data, none)).toHaveLength(0);
    // ...everything is visible once all milestones are granted...
    expect(listVisibleEvents(data, all)).toHaveLength(data.events.length);
    // ...and the ladder is not the chronological order of the events.
    const rank = (id: string) =>
      data.milestones.findIndex((milestone) => milestone.id === id);
    const oldest = data.events.find(
      (event) => event.id === 'evt-mundo-elemental',
    )!;
    const mondstadt = data.events.find(
      (event) => event.id === 'evt-rebelion-decarabian',
    )!;
    expect(rank(oldest.spoilerRequirements[0]!)).toBeGreaterThan(
      rank(mondstadt.spoilerRequirements[0]!),
    );
    // An entity opens with the event that is its own text, or otherwise only
    // after every event that mentions it.
    for (const entity of data.entities) {
      const home = data.events.find(
        (event) => event.dossierSection === entity.id,
      );
      const required = home
        ? [home]
        : data.events.filter((event) => event.entityIds.includes(entity.id));
      for (const event of required)
        expect(rank(entity.spoilerRequirements[0]!)).toBeGreaterThanOrEqual(
          rank(event.spoilerRequirements[0]!),
        );
    }
  });
  it('retains narrative years, uncertain visits and the disputed Mare Jivari chronology', () => {
    expect(
      data.events.find((event) => event.id === 'evt-caida-guili')?.time,
    ).toMatchObject({
      kind: 'approximate',
      reference: -3700,
      system: 'teyvat-presente-narrativo',
    });
    expect(data.events.every((event) => event.time.kind !== 'exact')).toBe(
      true,
    );
    expect(
      data.events.find((event) => event.id === 'evt-hiperborea')?.time.kind,
    ).toBe('unknown');
    expect(
      data.events.find((event) => event.id === 'evt-mare-jivari')?.certainty,
    ).toContain('disputed');
    expect(
      data.events.find((event) => event.id === 'evt-enkanomiya-watatsumi')
        ?.body,
    ).toContain('tampoco debe colocarse toda la historia de Watatsumi antes');
    expect(
      data.relations.find(
        (relation) =>
          relation.fromEventId === 'evt-llegada-gemelos' &&
          relation.toEventId === 'evt-cataclismo',
      )?.kind,
    ).toBe('association');
    expect(
      data.events.find((event) => event.id === 'evt-cataclismo')?.categories,
    ).toContain('Cierre contextual');
  });
  it('keeps event/entity navigation bidirectional and document references honest', () => {
    const event = getEventById(data, 'evt-hiperborea', all);
    const person = getEntityById(data, 'per-koitar', all);
    expect(event.status).toBe('visible');
    expect(person.status).toBe('visible');
    if (event.status !== 'visible' || person.status !== 'visible')
      throw new Error('Missing dossier content');
    expect(event.event.entities.map((entity) => entity.id)).toContain(
      person.entity.id,
    );
    expect(person.events.map((item) => item.id)).toContain(event.event.id);
    expect(
      event.event.evidence.some(
        (evidence) =>
          evidence.sourceUrl === '/dossier/historia/#evt-hiperborea',
      ),
    ).toBe(true);
    expect(
      event.event.evidence
        .filter((evidence) => evidence.sourceUrl?.startsWith('https:'))
        .every(
          (evidence) =>
            evidence.availability === 'Referencia externa sin contrastar',
        ),
    ).toBe(true);
    expect(getEntityById(data, 'missing', all)).toEqual({
      status: 'not-found',
    });
  });
  it('still excludes hidden drafts and entity/event restrictions when a future policy is added', () => {
    const copy = structuredClone(data);
    copy.entities.find(
      (entity) => entity.id === 'per-koitar',
    )!.editorialStatus = 'draft';
    copy.events.find(
      (event) => event.id === 'evt-hiperborea',
    )!.editorialStatus = 'draft';
    expect(getEntityById(copy, 'per-koitar', all)).toEqual({
      status: 'blocked',
    });
    expect(
      getVisibleTimeline(copy, all).events.some(
        (event) => event.id === 'evt-hiperborea',
      ),
    ).toBe(false);
    expect(getEntityById(copy, 'loc-hiperborea', all)).not.toEqual(
      getEntityById(data, 'loc-hiperborea', all),
    );
  });
  it('does not truncate a section at a table and does not absorb later unnumbered material', () => {
    const sinners = sections.find(
      (section) => section.id === 'per-cinco-pecadores',
    )!;
    expect(sinners.body).toContain('| `per-rerir` |');
    const twins = sections.find((section) => section.id === 'per-gemelos')!;
    expect(twins.body).not.toContain('Figuras de cierre');
    expect(() =>
      extractDossierSections('## A — `evt-uno`\n\nA\n\n## B — `evt-uno`\n\nB'),
    ).toThrow('ID repetido');
  });
  it('keeps text and links safe without executing HTML or executable Markdown', () => {
    const html = renderToStaticMarkup(
      createElement(DossierText, {
        text: '<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert) [ok](https://example.org/)\n\n| A | B |\n|---|---|\n| Uno | Dos |',
      }),
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://example.org/"');
    expect(html).toContain('<table>');
    expect(html).not.toContain('<td>---');
  });
  it('expands layout from data, keeps regional threads distinct, and never mutates historical records', () => {
    const copy = structuredClone(data);
    const content = getVisibleTimeline(copy, all);
    const layout = layoutTimeline(content);
    const sumeru = layout.nodes.filter(
      (node) =>
        node.narrativeThread === 'Sumeru' &&
        node.eraId === 'era-historias-regionales',
    );
    expect(sumeru.length).toBeGreaterThan(1);
    expect(new Set(sumeru.map((node) => node.y)).size).toBe(1);
    const mondstadt = layout.nodes.find(
      (node) => node.id === 'evt-rebelion-decarabian',
    )!;
    expect(mondstadt.y).not.toBe(sumeru[0]!.y);
    const extra = structuredClone(content.eras[0]!);
    extra.id = 'future-chapter';
    content.eras.push(extra);
    content.events.push({
      ...content.events[0]!,
      id: 'future-event',
      eraId: extra.id,
    });
    const expanded = layoutTimeline(content);
    expect(expanded.eras).toHaveLength(layout.eras.length + 1);
    expect(expanded.nodes.at(-1)?.id).toBe('future-event');
    expect(copy).toEqual(data);
    expect(DatasetSchema.safeParse(data).success).toBe(true);
  });
});

describe('relation revelation overrides', () => {
  const base = JSON.parse(
    readFileSync('content/editorial/genshin-revelation.json', 'utf8'),
  );
  const last = base.milestones.at(-1).id as string;
  // A link whose ends both open before the last milestone.
  const relation = data.relations.find((item) =>
    [item.fromEventId, item.toEventId].every(
      (id) =>
        !data.events
          .find((event) => event.id === id)!
          .spoilerRequirements.includes(last),
    ),
  )!;
  it('lets a link demand a milestone beyond both of its ends', async () => {
    const gated = await loadDossierContent({
      revelation: RevelationMapSchema.parse({
        ...base,
        relationOverrides: { [relation.id]: last },
      }),
    });
    const target = gated.relations.find((item) => item.id === relation.id)!;
    expect(target.spoilerRequirements).toEqual([last]);
    // Ends granted but not the link's own milestone: the link stays hidden.
    const ends = new Set(
      [relation.fromEventId, relation.toEventId].flatMap(
        (id) =>
          gated.events.find((event) => event.id === id)!.spoilerRequirements,
      ),
    );
    expect(ends.has(last)).toBe(false);
    expect(isRelationVisible(target, gated, ends)).toBe(false);
    expect(isRelationVisible(target, gated, new Set([...ends, last]))).toBe(
      true,
    );
  });
  it('rejects overrides for unknown relations or milestones', async () => {
    await expect(
      loadDossierContent({
        revelation: RevelationMapSchema.parse({
          ...base,
          relationOverrides: { 'rel-inexistente': base.milestones[0].id },
        }),
      }),
    ).rejects.toThrow(/relación inexistente/);
    await expect(
      loadDossierContent({
        revelation: RevelationMapSchema.parse({
          ...base,
          relationOverrides: { [relation.id]: 'hito-inexistente' },
        }),
      }),
    ).rejects.toThrow(/Hito de relación inexistente/);
  });
});
