import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform, type D3ZoomEvent } from 'd3-zoom';
import type { Size, Viewport } from './layout';

export const zoomLimits = [0.01, 2.4] as const;

// D3 owns gestures + its private transform on this surface, not rendered children.
// React receives snapshots and owns all SVG/HTML attributes and elements.
export function attachViewport(
  element: HTMLDivElement,
  onChange: (viewport: Viewport) => void,
) {
  const surface = select(element);
  const behavior = zoom<HTMLDivElement, unknown>()
    .scaleExtent([...zoomLimits])
    .extent((): [[number, number], [number, number]] => [
      [0, 0],
      [element.clientWidth, element.clientHeight],
    ])
    .clickDistance(5)
    .duration(0)
    .filter(
      (
        event: Event & {
          button?: number;
          ctrlKey?: boolean;
          metaKey?: boolean;
        },
      ) => {
        if (event.ctrlKey || event.metaKey || event.button) return false;
        // Wheel can zoom over nodes. Buttons retain clicks and keyboard interaction.
        return (
          event.type === 'wheel' ||
          !(
            event.target instanceof Element &&
            event.target.closest('button, a, input')
          )
        );
      },
    )
    .on('zoom', (event: D3ZoomEvent<HTMLDivElement, unknown>) => {
      const { x, y, k } = event.transform;
      onChange({ x, y, k });
    });
  surface.call(behavior).on('dblclick.zoom', null);

  return {
    set(viewport: Viewport) {
      surface.call(
        behavior.transform,
        zoomIdentity
          .translate(viewport.x, viewport.y)
          .scale(Math.max(zoomLimits[0], Math.min(zoomLimits[1], viewport.k))),
      );
    },
    scale(factor: number) {
      surface.call(behavior.scaleBy, factor);
    },
    pan(dx: number, dy: number) {
      const k = zoomTransform(element).k;
      surface.call(behavior.translateBy, dx / k, dy / k);
    },
    center(
      point: { x: number; y: number },
      size: Size,
      k = zoomTransform(element).k,
    ) {
      const scale = Math.max(zoomLimits[0], Math.min(zoomLimits[1], k));
      surface.call(
        behavior.transform,
        zoomIdentity
          .translate(
            size.width / 2 - point.x * scale,
            size.height / 2 - point.y * scale,
          )
          .scale(scale),
      );
    },
    destroy() {
      surface.on('.zoom', null);
    },
  };
}

export type ViewportController = ReturnType<typeof attachViewport>;
