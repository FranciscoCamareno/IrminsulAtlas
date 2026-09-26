import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadLocalContent } from '../src/content/local';
import {
  getEventById,
  getVisibleRelations,
  listVisibleEvents,
} from '../src/application/catalog';
import { meetsRequirements } from '../src/domain/visibility';
import DemoCatalog from '../src/components/DemoCatalog';

const fixture = await loadLocalContent();
const none = new Set<string>();
const chapterA = new Set(['demo-milestone-01']);
const chapterB = new Set(['demo-milestone-02']);

describe('visibility queries', () => {
  it('requires every milestone, allows independent optional progress and ignores unknown progress', () => {
    expect(
      meetsRequirements(['demo-milestone-01', 'demo-milestone-02'], chapterA),
    ).toBe(false);
    expect(meetsRequirements([], none)).toBe(true);
    expect(listVisibleEvents(fixture, none)).toHaveLength(13);
    expect(listVisibleEvents(fixture, chapterB)).toHaveLength(13);
    expect(listVisibleEvents(fixture, chapterA)).toHaveLength(14);
    expect(listVisibleEvents(fixture, new Set(['not-a-milestone']))).toEqual(
      listVisibleEvents(fixture, none),
    );
  });
  it('returns neutral direct lookup states without hidden titles or bodies', () => {
    expect(getEventById(fixture, 'demo-event-05', none)).toEqual({
      status: 'blocked',
    });
    expect(getEventById(fixture, 'missing', chapterA)).toEqual({
      status: 'not-found',
    });
    expect(getEventById(fixture, 'demo-event-05', chapterA).status).toBe(
      'visible',
    );
  });
  it('gates relations on both endpoints and their own requirements, in both lookup directions', () => {
    const relationIds = (id: string, progress: Set<string>) =>
      getVisibleRelations(fixture, id, progress).map((item) => item.id);
    expect(relationIds('demo-event-02', none)).toEqual([
      'demo-relation-01',
      'demo-relation-04',
    ]);
    expect(relationIds('demo-event-05', none)).toEqual([]);
    expect(relationIds('demo-event-02', chapterA)).toContain(
      'demo-relation-03',
    );
    expect(relationIds('demo-event-02', chapterA)).not.toContain(
      'demo-relation-02',
    );
    expect(relationIds('demo-event-03', chapterB)).toEqual([
      'demo-relation-02',
    ]);
  });
  it('filters hidden participants, sources and evidence before producing detail', () => {
    const data = structuredClone(fixture);
    data.sources[0]!.spoilerRequirements = ['demo-milestone-01'];
    data.events[1]!.evidence[1]!.spoilerRequirements = ['demo-milestone-02'];
    const first = getEventById(data, 'demo-event-01', none);
    const second = getEventById(data, 'demo-event-02', none);
    expect(first.status).toBe('visible');
    if (first.status !== 'visible' || second.status !== 'visible')
      throw new Error('Expected visible demo events');
    expect(first.event.entities.map((item) => item.id)).not.toContain(
      'demo-faction-01',
    );
    expect(first.event.evidence).toEqual([]);
    expect(second.event.evidence).toEqual([]);
    expect(JSON.stringify(first)).not.toContain(data.sources[0]!.title);
  });
  it('does not leak blocked event names through relative date labels', () => {
    const data = structuredClone(fixture);
    data.events[3]!.time = {
      kind: 'relative',
      before: [],
      after: ['demo-event-05'],
    };
    const visible = listVisibleEvents(data, none);
    expect(JSON.stringify(visible)).not.toContain(data.events[4]!.title);
    expect(
      visible.find((event) => event.id === 'demo-event-04')?.timeLabel,
    ).toContain('referencias no disponibles');
  });
  it('hides draft and era-blocked events and removes their connections', () => {
    const data = structuredClone(fixture);
    data.events[0]!.editorialStatus = 'draft';
    data.eras[1]!.spoilerRequirements = ['demo-milestone-02'];
    expect(listVisibleEvents(data, chapterA).map((item) => item.id)).toEqual([
      'demo-event-02',
      'demo-event-03',
      'demo-event-06',
      'demo-event-09',
      'demo-event-10',
      'demo-event-11',
      'demo-event-12',
      'demo-event-13',
      'demo-event-14',
    ]);
    expect(getVisibleRelations(data, 'demo-event-02', chapterA)).toEqual([]);
  });
  it('sorts by era and editorial order, without mutating dates or using revelation as history', () => {
    const data = structuredClone(fixture);
    data.events.reverse();
    const original = structuredClone(data);
    expect(listVisibleEvents(data, none).map((item) => item.id)).toEqual([
      'demo-event-01',
      'demo-event-02',
      'demo-event-03',
      'demo-event-06',
      'demo-event-04',
      'demo-event-07',
      'demo-event-08',
      'demo-event-09',
      'demo-event-10',
      'demo-event-11',
      'demo-event-12',
      'demo-event-13',
      'demo-event-14',
    ]);
    expect(data).toEqual(original);
  });
});

describe('static public markup', () => {
  it('renders only the allowed initial list and count', () => {
    const html = renderToStaticMarkup(
      createElement(DemoCatalog, { dataset: fixture }),
    );
    expect(html).toContain('13 eventos visibles');
    expect(html).not.toContain(fixture.events[4]!.title);
    expect(html).not.toContain('Círculo de la tinta');
    expect(html).toContain('/evento/?id=demo-event-01');
  });
  it('keeps the direct route neutral before hydration', () => {
    const html = renderToStaticMarkup(
      createElement(DemoCatalog, { dataset: fixture, detailPage: true }),
    );
    for (const event of fixture.events) expect(html).not.toContain(event.title);
    expect(html).toContain('Selecciona un evento');
  });
  it('renders untrusted content as text, not executable HTML', () => {
    const data = structuredClone(fixture);
    data.events[0]!.title = '<img src=x onerror=alert(1)>';
    const html = renderToStaticMarkup(
      createElement(DemoCatalog, { dataset: data }),
    );
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
  });
});
