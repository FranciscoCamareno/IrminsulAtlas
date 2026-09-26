import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import type { Dataset } from '../../domain/schema';
import {
  getEventById,
  getVisibleTimeline,
  listProgressOptions,
} from '../../application/catalog';
import { Detail } from '../DemoCatalog';
import TimelineCanvas from './TimelineCanvas';
import Icon from './Icon';

const subscribeLocation = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};
const readSelection = () =>
  new URLSearchParams(window.location.search).get('id') ?? '';
const serverSelection = () => '';

export default function TimelineExplorer({ dataset }: { dataset: Dataset }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const selectedId = useSyncExternalStore(
    subscribeLocation,
    readSelection,
    serverSelection,
  );
  const progress = useMemo(() => new Set(completed), [completed]);
  const content = useMemo(
    () => getVisibleTimeline(dataset, progress),
    [dataset, progress],
  );
  const result = selectedId
    ? getEventById(dataset, selectedId, progress)
    : null;
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const previousSelection = useRef('');

  useEffect(() => {
    if (menuOpen) menu.current?.showModal();
    else if (menu.current?.open) menu.current.close();
  }, [menuOpen]);
  useEffect(() => {
    if (selectedId) detailHeading.current?.focus();
    else if (previousSelection.current) {
      const node = shell.current?.querySelector<HTMLButtonElement>(
        `[${listOpen ? 'data-list-event-id' : 'data-event-id'}="${CSS.escape(previousSelection.current)}"]`,
      );
      (
        node ??
        shell.current?.querySelector<HTMLDivElement>('.timeline-surface')
      )?.focus();
    }
    previousSelection.current = selectedId;
  }, [selectedId, result?.status, listOpen]);

  function selectEvent(id: string) {
    window.history.pushState(
      null,
      '',
      id ? `/?id=${encodeURIComponent(id)}` : '/',
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function navigateRelation(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    selectEvent(new URL(event.currentTarget.href).searchParams.get('id') ?? '');
  }
  const options = listProgressOptions(dataset);

  return (
    <div
      ref={shell}
      className={`atlas-shell ${light ? 'atlas-light' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !menuOpen && selectedId) {
          event.stopPropagation();
          selectEvent('');
        }
      }}
    >
      <header className="atlas-navbar">
        <button
          type="button"
          className="atlas-icon-button menu-trigger"
          ref={menuButton}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="atlas-menu"
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
          <span>Explorar</span>
        </button>
        <a
          href="/"
          className="atlas-wordmark"
          onClick={(event) => {
            if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
              event.preventDefault();
              selectEvent('');
            }
          }}
        >
          Irminsul <span>Atlas</span>
        </a>
        <div className="navbar-actions">
          <span className="demo-label">
            <span />
            Demostración
          </span>
          <button
            type="button"
            className="atlas-icon-button"
            aria-label={
              listOpen ? 'Mostrar cronología' : 'Mostrar vista de lista'
            }
            aria-pressed={listOpen}
            title="Alternar cronología y lista"
            onClick={() => setListOpen(!listOpen)}
          >
            <Icon name={listOpen ? 'compass' : 'list'} />
          </button>
        </div>
      </header>
      <div className={`atlas-workspace ${selectedId ? 'has-detail' : ''}`}>
        <h1 className="sr-only">Cronología interactiva de Irminsul Atlas</h1>
        <div
          className={
            listOpen ? 'canvas-container is-hidden' : 'canvas-container'
          }
          aria-hidden={listOpen}
          inert={listOpen}
        >
          <TimelineCanvas
            content={content}
            selectedId={result?.status === 'visible' ? selectedId : null}
            onSelect={selectEvent}
          />
        </div>
        {listOpen && (
          <section className="atlas-list" aria-label="Vista de lista">
            <div className="atlas-list-heading">
              <span className="atlas-kicker">
                Archivo de la Bruma · Demostración
              </span>
              <h2>Acontecimientos</h2>
              <p role="status">{content.events.length} eventos visibles</p>
            </div>
            <ol>
              {content.events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    data-list-event-id={event.id}
                    onClick={() => selectEvent(event.id)}
                  >
                    <span className="atlas-kicker">{event.eraName}</span>
                    <strong>{event.title}</strong>
                    <span>{event.timeLabel}</span>
                    <Icon name="arrow" />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
        {result && (
          <aside className="atlas-detail" aria-labelledby="detail-heading">
            <div className="detail-toolbar">
              <h2 id="detail-heading" ref={detailHeading} tabIndex={-1}>
                {result.status === 'visible'
                  ? 'Acontecimiento'
                  : 'Detalle del archivo'}
              </h2>
              <button
                type="button"
                className="atlas-icon-button"
                aria-label="Cerrar detalle"
                onClick={() => selectEvent('')}
              >
                <Icon name="close" />
              </button>
            </div>
            {result.status === 'visible' ? (
              <Detail event={result.event} onNavigate={navigateRelation} />
            ) : (
              <div className="detail-message" role="status">
                <Icon name="compass" />
                <p>
                  {result.status === 'blocked'
                    ? 'Contenido no disponible con tu progreso actual.'
                    : 'No se encontró el evento solicitado.'}
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setMenuOpen(true)}
                >
                  Revisar progreso
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
      <dialog
        id="atlas-menu"
        ref={menu}
        className="atlas-menu"
        onCancel={() => setMenuOpen(false)}
        onClose={() => {
          setMenuOpen(false);
          menuButton.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
        aria-labelledby="menu-title"
      >
        <div className="menu-content">
          <div className="menu-top">
            <h2 id="menu-title">Explorar el Atlas</h2>
            <button
              type="button"
              className="atlas-icon-button"
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <nav aria-label="Secciones del Atlas">
            <button
              type="button"
              className="menu-current"
              onClick={() => {
                setListOpen(false);
                setMenuOpen(false);
              }}
            >
              <Icon name="compass" />
              Cronología
              <Icon name="arrow" />
            </button>
            {['Personajes', 'Ubicaciones', 'Otros datos'].map((label) => (
              <div className="menu-future" key={label}>
                <span>{label}</span>
                <small>Próximamente</small>
              </div>
            ))}
          </nav>
          <details className="menu-progress">
            <summary>Progreso de lectura</summary>
            <p>
              Marca solo las lecturas que quieras revelar en esta demostración.
            </p>
            <fieldset>
              <legend className="sr-only">Lecturas completadas</legend>
              {options.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={completed.includes(option.id)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setCompleted((previous) =>
                        checked
                          ? [...previous, option.id]
                          : previous.filter((id) => id !== option.id),
                      );
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <small>
              Se reinicia al recargar. Los archivos estáticos siguen siendo
              públicos.
            </small>
          </details>
          <div className="menu-bottom">
            <button
              type="button"
              className="theme-button"
              onClick={() => setLight(!light)}
            >
              <Icon name={light ? 'moon' : 'sun'} />
              {light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
            </button>
            <p>
              Contenido ficticio para explorar la estructura. No representa lore
              de Genshin Impact.
            </p>
          </div>
        </div>
      </dialog>
      <noscript>
        <div className="atlas-noscript">
          Activa JavaScript para mover y ampliar la cronología.{' '}
          <a href="/lista/">Leer los acontecimientos en una lista</a>.
        </div>
      </noscript>
    </div>
  );
}
