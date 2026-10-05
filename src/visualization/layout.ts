import { scalePoint } from 'd3-scale';
import type { TimelineContent } from '../application/catalog';

// Positions are a disposable projection of editorial order, never dates.
export function layoutTimeline(content: TimelineContent) {
  if (content.events.some((event) => event.narrativeThread))
    return layoutDossier(content);
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
      focusY: 310,
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

// Chapters are reading groups, not disjoint date intervals. Parallel regional
// threads get their own rows; x spacing expresses no elapsed time.
function layoutDossier(content: TimelineContent) {
  // Spacing fits a full-size label at 100%: titles stay readable from about
  // 50%, so a chapter and its neighbours share the screen.
  const COLUMN = 250;
  const LINE = 300;
  const TOP = 160;
  let cursor = 120;
  let height = 480;
  const nodes: Array<
    TimelineContent['events'][number] & { x: number; y: number; index: number }
  > = [];
  const eras = content.eras.map((era, eraIndex) => {
    const events = content.events.filter((event) => event.eraId === era.id);
    const threads = [
      ...new Set(events.map((event) => event.narrativeThread ?? 'Historia')),
    ];
    // A thread longer than WRAP acts continues on the next line of its row.
    const WRAP = 4;
    const counts = threads.map(
      (thread) =>
        events.filter(
          (event) => (event.narrativeThread ?? 'Historia') === thread,
        ).length,
    );
    const lines = counts.map((count) => Math.max(1, Math.ceil(count / WRAP)));
    const span = (count: number) => count * LINE;
    const offsets = lines.map((_, index) =>
      lines.slice(0, index).reduce((sum, value) => sum + span(value), 0),
    );
    const maxColumns = Math.min(WRAP, Math.max(1, ...counts));
    const width = Math.max(420, maxColumns * COLUMN + 120);
    const columns = new Map<string, number>();
    events.forEach((event) => {
      const thread = event.narrativeThread ?? 'Historia';
      const column = columns.get(thread) ?? 0;
      columns.set(thread, column + 1);
      const row = threads.indexOf(thread);
      nodes.push({
        ...event,
        x: cursor + 100 + (column % WRAP) * COLUMN,
        y: TOP + offsets[row]! + Math.floor(column / WRAP) * LINE,
        index: nodes.length + 1,
      });
    });
    height = Math.max(
      height,
      TOP + 120 + lines.reduce((sum, value) => sum + span(value), 0),
    );
    const group = {
      ...era,
      x: cursor,
      center: cursor + width / 2,
      focusY: TOP,
      width,
      count: events.length,
      index: eraIndex + 1,
    };
    cursor += width + 120;
    return group;
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = content.relations.flatMap((relation) => {
    const from = byId.get(relation.fromEventId),
      to = byId.get(relation.toEventId);
    return from && to ? [{ ...relation, from, to }] : [];
  });
  return { nodes, edges, eras, width: Math.max(cursor, 600), height };
}

export type TimelineLayout = ReturnType<typeof layoutTimeline>;
// 'map' draws every event as a point with its connections and no titles.
export type DetailLevel = 'map' | 'events' | 'details';
export interface Viewport {
  x: number;
  y: number;
  k: number;
}
export interface Size {
  width: number;
  height: number;
}

export const mapZoom = 0.45;

export function detailLevel(k: number): DetailLevel {
  return k < mapZoom ? 'map' : k < 1.3 ? 'events' : 'details';
}

export function fitViewport(
  layout: Pick<TimelineLayout, 'width' | 'height'>,
  size: Size,
): Viewport {
  const k = Math.min(
    1,
    Math.max(
      0.01,
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

export interface NodeGroup {
  id: string;
  x: number;
  y: number;
  members: string[];
}

// Dense data sets only. Nodes whose screen positions fall in the same cell are
// replaced by one group marker; nodes in `keep` (selection and its links) always
// stay individual, and a cell with a single node is not a group. Cells are fixed
// in screen size, so zooming in splits a group into its members.
export function groupByDensity<T extends { id: string; x: number; y: number }>(
  nodes: readonly T[],
  k: number,
  keep: ReadonlySet<string>,
  cell = 110,
): { singles: T[]; groups: NodeGroup[] } {
  const size = cell / k;
  const buckets = new Map<string, T[]>();
  const singles: T[] = [];
  for (const node of nodes) {
    if (keep.has(node.id)) {
      singles.push(node);
      continue;
    }
    const key = `${Math.floor(node.x / size)}:${Math.floor(node.y / size)}`;
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(node);
  }
  const groups: NodeGroup[] = [];
  for (const [key, members] of buckets) {
    if (members.length === 1) {
      singles.push(members[0]!);
      continue;
    }
    groups.push({
      id: 'grupo-' + key,
      x: members.reduce((sum, item) => sum + item.x, 0) / members.length,
      y: members.reduce((sum, item) => sum + item.y, 0) / members.length,
      members: members.map((item) => item.id),
    });
  }
  return { singles, groups };
}
