import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { TimelineContent } from '../../application/catalog';
import {
  connectionPath,
  detailLevel,
  fitViewport,
  layoutTimeline,
  project,
  type Size,
  type Viewport,
} from '../../visualization/layout';
import {
  attachViewport,
  zoomLimits,
  type ViewportController,
} from '../../visualization/viewport';
import Icon from './Icon';

export default function TimelineCanvas({
  content,
  selectedId,
  onSelect,
  preview = false,
  dossier = false,
}: {
  content: TimelineContent;
  preview?: boolean;
  dossier?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const layout = useMemo(() => layoutTimeline(content), [content]);
  const surface = useRef<HTMLDivElement>(null);
  const controller = useRef<ViewportController | null>(null);
  const size = useRef<Size>({ width: 1280, height: 760 });
  const [dimensions, setDimensions] = useState<Size>({
    width: 1280,
    height: 760,
  });
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, k: 0.7 });
  const latestViewport = useRef(viewport);
  const initialLayout = useRef(layout);
  const level = detailLevel(viewport.k);
  const overview = dossier && level === 'eras';

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    let first = true;
    const controls = attachViewport(element, (next) => {
      latestViewport.current = next;
      setViewport(next);
    });
    controller.current = controls;
    const resize = () => {
      const next = {
        width: element.clientWidth || 1280,
        height: element.clientHeight || 760,
      };
      if (first) {
        // Start at event level, with room to pan; "Ver todo" provides the overview.
        const fit = fitViewport(initialLayout.current, next);
        const k = Math.max(0.65, fit.k);
        controls.set(
          initialLayout.current.nodes.some((node) => node.narrativeThread)
            ? fit
            : {
                k,
                x: 70,
                y: (next.height - initialLayout.current.height * k) / 2,
              },
        );
        first = false;
      } else {
        const previous = latestViewport.current;
        controls.set({
          ...previous,
          x: previous.x + (next.width - size.current.width) / 2,
          y: previous.y + (next.height - size.current.height) / 2,
        });
      }
      size.current = next;
      setDimensions(next);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      controls.destroy();
      controller.current = null;
    };
  }, []);

  const selectedNode = layout.nodes.find((node) => node.id === selectedId);
  const selectedPoint = selectedNode
    ? { x: selectedNode.x, y: selectedNode.y }
    : null;
  const selectedX = selectedPoint?.x;
  const selectedY = selectedPoint?.y;
  useEffect(() => {
    if (selectedX !== undefined && selectedY !== undefined) {
      controller.current?.center(
        { x: selectedX, y: selectedY },
        size.current,
        Math.max(latestViewport.current.k, 0.9),
      );
    }
  }, [selectedId, selectedX, selectedY]);

  const connected = new Set(
    layout.edges
      .filter(
        (edge) => edge.from.id === selectedId || edge.to.id === selectedId,
      )
      .flatMap((edge) => [edge.from.id, edge.to.id]),
  );
  const renderedNodes = layout.nodes.filter(
    (node) =>
      level === 'details' ||
      node.importance === 'major' ||
      node.id === selectedId ||
      connected.has(node.id),
  );
  const renderedIds = new Set(renderedNodes.map((node) => node.id));
  const compactOverview = dimensions.width < 640 && level === 'eras';
  function eraPosition(era: (typeof layout.eras)[number]) {
    return compactOverview
      ? {
          x: dimensions.width / 2,
          y:
            90 +
            (era.index - 1) *
              Math.max(
                48,
                (dimensions.height - 260) / Math.max(layout.eras.length - 1, 1),
              ),
        }
      : project({ x: era.center, y: 300 }, viewport);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [100, 0],
      ArrowRight: [-100, 0],
      ArrowUp: [0, 100],
      ArrowDown: [0, -100],
    };
    const delta = offsets[event.key];
    if (delta) {
      event.preventDefault();
      controller.current?.pan(...delta);
    }
    if (['+', '=', '-', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home')
        controller.current?.set(fitViewport(layout, size.current));
      else controller.current?.scale(event.key === '-' ? 1 / 1.3 : 1.3);
    }
  }

  return (
    <div
      className={`timeline-stage ${compactOverview ? 'compact-overview' : ''}`}
    >
      <div className="canvas-heading" aria-hidden="true">
        <span className="atlas-kicker">
          {dossier || preview ? 'Genshin Impact' : 'Archivo de la Bruma'}
        </span>
        <span>
          {dossier
            ? 'Historia antigua · Primer borrador visible'
            : preview
              ? 'Vista previa · historias y conexiones'
              : 'Cronología de demostración'}
        </span>
      </div>
      <div
        ref={surface}
        className="timeline-surface"
        tabIndex={0}
        role="region"
        aria-label="Cronología interactiva"
        aria-describedby="canvas-help"
        onKeyDown={keyboard}
        data-level={level}
      >
        <svg
          className="timeline-lines"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="timeline-arrow"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {(overview ? [] : layout.eras).map((era) => {
            const start = project({ x: era.x, y: 0 }, viewport);
            const end = project({ x: era.x, y: layout.height }, viewport);
            return (
              <g key={era.id}>
                <line
                  x1={start.x}
                  y1={start.y + 45}
                  x2={end.x}
                  y2={end.y}
                  className="era-divider"
                />
                <line
                  x1={start.x}
                  y1={end.y}
                  x2={start.x + era.width * viewport.k}
                  y2={end.y}
                  className="era-axis"
                />
              </g>
            );
          })}
          {overview
            ? null
            : level === 'eras'
              ? layout.eras.slice(1).map((era, index) => {
                  const previous = layout.eras[index]!;
                  return (
                    <path
                      key={era.id}
                      d={connectionPath(
                        eraPosition(previous),
                        eraPosition(era),
                      )}
                      className="era-order-line"
                    />
                  );
                })
              : layout.edges
                  .filter(
                    (edge) =>
                      (!dossier ||
                        !selectedId ||
                        edge.from.id === selectedId ||
                        edge.to.id === selectedId) &&
                      renderedIds.has(edge.from.id) &&
                      renderedIds.has(edge.to.id),
                  )
                  .map((edge) => {
                    const active =
                      edge.from.id === selectedId || edge.to.id === selectedId;
                    return (
                      <path
                        key={edge.id}
                        d={connectionPath(
                          project(edge.from, viewport),
                          project(edge.to, viewport),
                        )}
                        className={`timeline-connection ${active ? 'is-active' : ''} ${selectedId && !active ? 'is-muted' : ''} ${edge.claimStatus === 'fact' ? '' : 'is-inferred'}`}
                        markerEnd={
                          edge.directed ? 'url(#timeline-arrow)' : undefined
                        }
                      />
                    );
                  })}
        </svg>
        {(overview ? [] : layout.eras).map((era) => {
          const position =
            level === 'eras'
              ? eraPosition(era)
              : project({ x: era.x, y: 0 }, viewport);
          return level === 'eras' ? (
            <button
              type="button"
              className="era-group"
              key={era.id}
              style={{ left: position.x, top: position.y }}
              onClick={() =>
                controller.current?.center(
                  { x: era.center, y: 310 },
                  size.current,
                  0.95,
                )
              }
              aria-label={`Explorar ${era.name}, ${era.count} eventos visibles`}
            >
              <span className="era-orbit">
                <span>{String(era.index).padStart(2, '0')}</span>
              </span>
              <strong>{era.name}</strong>
              <span>{era.count} acontecimientos</span>
            </button>
          ) : (
            <div
              className="era-label"
              key={era.id}
              style={{ left: position.x, top: position.y }}
            >
              <span>{String(era.index).padStart(2, '0')}</span>
              <strong>{era.name}</strong>
            </div>
          );
        })}
        {(overview
          ? []
          : level === 'eras'
            ? layout.nodes.filter((node) => node.id === selectedId)
            : renderedNodes
        ).map((node) => {
          const position = project(node, viewport);
          return (
            <button
              type="button"
              key={node.id}
              data-event-id={node.id}
              className={`timeline-node ${node.importance} ${node.id === selectedId ? 'is-selected' : ''} ${connected.has(node.id) ? 'is-connected' : ''} ${selectedId && !connected.has(node.id) && node.id !== selectedId ? 'is-muted' : ''}`}
              style={{ left: position.x, top: position.y }}
              aria-label={`Abrir ${node.title}`}
              aria-pressed={node.id === selectedId}
              onClick={() => onSelect(node.id)}
              onFocus={() => {
                const width = size.current.width;
                const height = size.current.height;
                if (
                  position.x < 90 ||
                  position.x > width - 160 ||
                  position.y < 100 ||
                  position.y > height - 100
                )
                  controller.current?.center(node, size.current);
              }}
            >
              <span className="node-symbol" aria-hidden="true">
                <span className="node-diamond" />
                <span className="node-core" />
              </span>
              <span className="node-label">
                <span className="node-order">
                  {node.narrativeThread ?? String(node.index).padStart(2, '0')}{' '}
                  /{' '}
                  {node.claimStatus === 'theory'
                    ? 'TEORÍA'
                    : node.timeLabel.includes('desconocida')
                      ? 'SIN FECHA'
                      : 'ACONTECIMIENTO'}
                </span>
                <strong>{node.title}</strong>
                {level === 'details' && (
                  <span className="node-time">
                    {node.timeLabel.length > 100
                      ? node.timeLabel.slice(0, 97) + '…'
                      : node.timeLabel}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {!layout.nodes.length && (
          <p className="canvas-empty">
            No hay acontecimientos visibles con este progreso.
          </p>
        )}
      </div>
      {overview && (
        <section
          className="dossier-overview"
          aria-label="Capítulos de la historia"
        >
          <div className="overview-intro">
            <h2>Del mundo elemental al Cataclismo</h2>
            <p>
              Elige un capítulo para explorar sus acontecimientos. Las
              trayectorias regionales se solapan; el orden de lectura no fija
              fechas ni simultaneidad.
            </p>
          </div>
          <div className="chapter-grid">
            {layout.eras.map((era) => (
              <button
                type="button"
                className="chapter-card"
                key={era.id}
                aria-label={
                  'Explorar ' +
                  era.name +
                  ', ' +
                  era.count +
                  ' eventos visibles'
                }
                onClick={() => {
                  const first = layout.nodes.find(
                    (node) => node.eraId === era.id,
                  );
                  if (first)
                    controller.current?.center(first, size.current, 0.9);
                }}
              >
                <span className="atlas-kicker">
                  {String(era.index).padStart(2, '0')} / {era.count}{' '}
                  acontecimientos
                </span>
                <strong>{era.name}</strong>
                <span>{era.description}</span>
                <span className="chapter-action">Explorar capítulo →</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {dossier && !overview && (
        <label className="chapter-jump">
          Ir a capítulo
          <select
            defaultValue=""
            onChange={(event) => {
              const first = layout.nodes.find(
                (node) => node.eraId === event.target.value,
              );
              if (first) controller.current?.center(first, size.current, 0.9);
            }}
          >
            <option value="" disabled>
              Seleccionar…
            </option>
            {layout.eras.map((era) => (
              <option value={era.id} key={era.id}>
                {era.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="canvas-bottom">
        <div className="canvas-caption">
          <span className="atlas-kicker">
            {overview
              ? null
              : level === 'eras'
                ? '01 / Épocas'
                : level === 'events'
                  ? '02 / Acontecimientos'
                  : '03 / Detalle'}
          </span>
          <p id="canvas-help">
            {overview
              ? 'Desplázate por los capítulos y elige uno'
              : 'Arrastra para explorar · Rueda para acercar'}
            <span className="sr-only">
              . Con foco en el lienzo: flechas para desplazar, más y menos para
              zoom, Inicio para ver todo. Ctrl más o menos conserva el zoom del
              navegador.
            </span>
          </p>
          <small>
            {dossier
              ? 'Orden de lectura; distancias y filas no representan duración ni simultaneidad. Conexiones discontinuas: interpretación del dossier.'
              : preview
                ? 'Vista previa: distribución y conexiones provisionales. Contiene spoilers.'
                : 'Orden narrativo; las distancias no representan duración.'}
          </small>
        </div>
        <div
          className="zoom-controls"
          role="group"
          aria-label="Controles de cronología"
        >
          <button
            type="button"
            aria-label="Alejar cronología"
            title="Alejar"
            onClick={() => controller.current?.scale(1 / 1.3)}
            disabled={viewport.k <= zoomLimits[0]}
          >
            <Icon name="minus" />
          </button>
          <output aria-label="Nivel de zoom">
            {Math.round(viewport.k * 100)}%
          </output>
          <button
            type="button"
            aria-label="Acercar cronología"
            title="Acercar"
            onClick={() => controller.current?.scale(1.3)}
            disabled={viewport.k >= zoomLimits[1]}
          >
            <Icon name="plus" />
          </button>
          <span className="control-divider" />
          <button
            type="button"
            aria-label="Ver toda la cronología"
            title="Ver todo"
            onClick={() =>
              controller.current?.set(fitViewport(layout, size.current))
            }
          >
            <Icon name="fit" />
          </button>
          {selectedNode && (
            <button
              type="button"
              aria-label="Volver al evento seleccionado"
              title="Centrar selección"
              onClick={() =>
                controller.current?.center(selectedNode, size.current)
              }
            >
              <Icon name="focus" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
