import { describe, expect, it } from 'vitest';
import { loadLocalContent } from '../src/content/local';
import { getVisibleTimeline } from '../src/application/catalog';
import {
  detailLevel,
  fitViewport,
  layoutTimeline,
  project,
} from '../src/visualization/layout';

const data = await loadLocalContent();

describe('timeline projection', () => {
  it('filters before calculating eras, counts, coordinates and connections', () => {
    const content = getVisibleTimeline(data, new Set());
    const layout = layoutTimeline(content);
    expect(layout.nodes).toHaveLength(13);
    expect(layout.nodes.some((node) => node.id === 'demo-event-05')).toBe(
      false,
    );
    expect(layout.edges.some((edge) => edge.id === 'demo-relation-03')).toBe(
      false,
    );
    expect(layout.edges.some((edge) => edge.id === 'demo-relation-02')).toBe(
      false,
    );
    expect(layout.eras.reduce((sum, era) => sum + era.count, 0)).toBe(13);
    expect(JSON.stringify(layout)).not.toContain(
      'Hallazgo de la sala interior',
    );
    const unlocked = layoutTimeline(
      getVisibleTimeline(
        data,
        new Set(['demo-milestone-01', 'demo-milestone-02']),
      ),
    );
    expect(unlocked.nodes).toHaveLength(14);
    expect(unlocked.edges).toHaveLength(17);
  });
  it('uses editorial order without mutating or fabricating dates', () => {
    const original = structuredClone(data);
    const layout = layoutTimeline(getVisibleTimeline(data, new Set()));
    for (const [index, node] of layout.nodes.entries()) {
      if (index) expect(node.x).toBeGreaterThan(layout.nodes[index - 1]!.x);
      expect(Number.isFinite(node.y)).toBe(true);
    }
    expect(data).toEqual(original);
    expect(data.events[0]!.time).toEqual({
      kind: 'unknown',
      label: 'Fecha desconocida',
    });
  });
  it('handles no permitted content without leaking empty eras', () => {
    const hidden = structuredClone(data);
    hidden.events.forEach((event) => {
      event.spoilerRequirements = ['demo-milestone-01'];
    });
    const layout = layoutTimeline(getVisibleTimeline(hidden, new Set()));
    expect(layout.nodes).toEqual([]);
    expect(layout.eras).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(
      Number.isFinite(fitViewport(layout, { width: 320, height: 480 }).k),
    ).toBe(true);
  });
  it('fits a desktop overview and exposes semantic levels without shrinking labels', () => {
    const layout = layoutTimeline(getVisibleTimeline(data, new Set()));
    const viewport = fitViewport(layout, { width: 1280, height: 720 });
    const first = project({ x: 0, y: 0 }, viewport);
    const last = project({ x: layout.width, y: layout.height }, viewport);
    expect(first.x).toBeGreaterThanOrEqual(0);
    expect(last.x).toBeLessThanOrEqual(1280);
    expect(last.y).toBeLessThanOrEqual(720);
    expect(detailLevel(0.3)).toBe('eras');
    expect(detailLevel(0.8)).toBe('events');
    expect(detailLevel(1.4)).toBe('details');
  });
});
