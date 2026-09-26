import { scalePoint } from 'd3-scale';
import type { TimelineContent } from '../application/catalog';

// Positions are a disposable projection of editorial order, never dates.
export function layoutTimeline(content: TimelineContent) {
  let cursor = 120;
  const nodes: Array<
    TimelineContent['events'][number] & { x: number; y: number; index: number }
  > = [];
  const eras = content.eras.map((era, eraIndex) => {
    const events = content.events.filter((event) => event.eraId === era.id);
    const width = Math.max(460, events.length * 150);
    const scale = scalePoint<string>()
      .domain(events.map((event) => event.id))
      .range([cursor + 70, cursor + width - 100]);
    // Alternating rows keep adjacent labels apart. Rows imply no historical meaning.
    const rows = [310, 150, 470, 270];
    events.forEach((event, index) =>
      nodes.push({
        ...event,
        x: scale(event.id) ?? cursor,
        y: rows[(index + eraIndex) % rows.length]!,
        index: nodes.length + 1,
      }),
    );
    const group = {
      ...era,
      x: cursor,
      center: cursor + width / 2,
      width,
      count: events.length,
      index: eraIndex + 1,
    };
    cursor += width + 110;
    return group;
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = content.relations.flatMap((relation) => {
    const from = byId.get(relation.fromEventId);
    const to = byId.get(relation.toEventId);
    return from && to ? [{ ...relation, from, to }] : [];
  });
  return { nodes, edges, eras, width: Math.max(cursor, 600), height: 660 };
}

export type TimelineLayout = ReturnType<typeof layoutTimeline>;
export type DetailLevel = 'eras' | 'events' | 'details';
export interface Viewport {
  x: number;
  y: number;
  k: number;
}
export interface Size {
  width: number;
  height: number;
}

export function detailLevel(k: number): DetailLevel {
  return k < 0.48 ? 'eras' : k < 1.15 ? 'events' : 'details';
}

export function fitViewport(
  layout: Pick<TimelineLayout, 'width' | 'height'>,
  size: Size,
): Viewport {
  const k = Math.min(
    1,
    Math.max(
      0.08,
      Math.min(
        (size.width - 100) / layout.width,
        (size.height - 160) / layout.height,
      ),
    ),
  );
  return {
    k,
    x: (size.width - layout.width * k) / 2,
    y: (size.height - layout.height * k) / 2,
  };
}

export function project(point: { x: number; y: number }, viewport: Viewport) {
  return {
    x: point.x * viewport.k + viewport.x,
    y: point.y * viewport.k + viewport.y,
  };
}

export function connectionPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const middle = (from.x + to.x) / 2;
  return `M${from.x},${from.y} C${middle},${from.y} ${middle},${to.y} ${to.x},${to.y}`;
}
