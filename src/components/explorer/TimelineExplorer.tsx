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
  getEntityById,
  listVisibleEntities,
  getVisibleTimeline,
  listProgressOptions,
} from '../../application/catalog';
import { Detail } from '../DemoCatalog';
import DossierText, { dossierHref } from '../DossierText';
import TimelineCanvas from './TimelineCanvas';
import Icon from './Icon';

const subscribeLocation = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};
const readSelection = () => window.location.search;
const serverSelection = () => '';

export default function TimelineExplorer({ dataset }: { dataset: Dataset }) {
  const dossier = dataset.universes.some(
    (universe) => universe.id === 'genshin',
  );
  const [directory, setDirectory] = useState<'character' | 'place' | null>(
    null,
  );
  const [query, setQuery] = useState('');
  const preview = dataset.universes.some(
    (universe) => universe.id === 'genshin-preview',
  );
  const [completed, setCompleted] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const selection = useSyncExternalStore(
    subscribeLocation,
    readSelection,
    serverSelection,
  );
  const selectedId = new URLSearchParams(selection).get('id') ?? '';
  const entityId = new URLSearchParams(selection).get('entity') ?? '';
  const progress = useMemo(() => new Set(completed), [completed]);
  const content = useMemo(
    () => getVisibleTimeline(dataset, progress),
    [dataset, progress],
  );
  const result = selectedId
    ? getEventById(dataset, selectedId, progress)
    : null;
  const entityResult = entityId
    ? getEntityById(dataset, entityId, progress)
    : null;
  const entries = listVisibleEntities(dataset, progress).filter(
    (entity) =>
      entity.kind === directory &&
      entity.name
        .toLocaleLowerCase('es')
        .includes(query.toLocaleLowerCase('es')),
  );
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const previousSelection = useRef('');
  const previousEntity = useRef('');

  useEffect(() => {
    if (menuOpen) menu.current?.showModal();
    else if (menu.current?.open) menu.current.close();
  }, [menuOpen]);
  useEffect(() => {
    if (entityId || (selectedId && !previousEntity.current))
      detailHeading.current?.focus();
    else if (previousEntity.current) {
      const trigger = shell.current?.querySelector<HTMLElement>(
        '[data-entity-id="' + CSS.escape(previousEntity.current) + '"]',
      );
      (trigger ?? detailHeading.current)?.focus();
    } else if (previousSelection.current) {
      const node = shell.current?.querySelector<HTMLButtonElement>(
        `[${listOpen ? 'data-list-event-id' : 'data-event-id'}="${CSS.escape(previousSelection.current)}"]`,
      );
      (
        node ??
        shell.current?.querySelector<HTMLDivElement>('.timeline-surface')
      )?.focus();
    }
    previousSelection.current = selectedId;
    previousEntity.current = entityId;
  }, [selectedId, entityId, result?.status, listOpen]);

  function selectEvent(id: string, entity = '') {
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    if (entity) params.set('entity', entity);
    window.history.pushState(null, '', '/' + (params.size ? '?' + params : ''));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function closeDetail() {
    selectEvent(entityId ? selectedId : '');
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
    const params = new URL(event.currentTarget.href).searchParams;
    const entity = params.get('entity');
    if (entity) selectEvent(params.get('id') ?? selectedId, entity);
    else selectEvent(params.get('id') ?? '');
  }
  const options = listProgressOptions(dataset);

  return (
    <div
      ref={shell}
      className={`atlas-shell ${light ? 'atlas-light' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !menuOpen && (selectedId || entityId)) {
          event.stopPropagation();
          closeDetail();
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
            {dossier
              ? 'Primer borrador'
              : preview
                ? 'Vista previa'
                : 'Demostración'}
          </span>
          <button
            type="button"
            className="atlas-icon-button"
            aria-label={
              listOpen ? 'Mostrar cronología' : 'Mostrar vista de lista'
            }
            aria-pressed={listOpen}
            title="Alternar cronología y lista"
            onClick={() => {
              setDirectory(null);
              setListOpen(!listOpen);
            }}
          >
            <Icon name={listOpen ? 'compass' : 'list'} />
          </button>
        </div>
      </header>
      <div
        className={`atlas-workspace ${selectedId || entityId ? 'has-detail' : ''}`}
      >
        <h1 className="sr-only">Cronología interactiva de Irminsul Atlas</h1>
        <div
          className={
            listOpen || directory
              ? 'canvas-container is-hidden'
              : 'canvas-container'
          }
          aria-hidden={listOpen || !!directory}
          inert={listOpen || !!directory}
        >
          <TimelineCanvas
            preview={preview}
            dossier={dossier}
            content={content}
            selectedId={result?.status === 'visible' ? selectedId : null}
            onSelect={selectEvent}
          />
        </div>
        {listOpen && !directory && (
          <section className="atlas-list" aria-label="Vista de lista">
            <div className="atlas-list-heading">
              <span className="atlas-kicker">
                {dossier
                  ? 'Genshin Impact · Historia antigua'
                  : preview
                    ? 'Genshin Impact · Vista previa'
                    : 'Archivo de la Bruma · Demostración'}
              </span>
              <h2>{preview ? 'Historias y fuentes' : 'Acontecimientos'}</h2>
              <p role="status">
                {content.events.length}{' '}
                {preview ? 'fuentes en la vista previa' : 'eventos visibles'}
              </p>
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
        {directory && (
          <section
            className="atlas-list"
            aria-label={directory === 'character' ? 'Personajes' : 'Lugares'}
          >
            <div className="atlas-list-heading">
              <span className="atlas-kicker">Dossier · Primer borrador</span>
              <h2>{directory === 'character' ? 'Personajes' : 'Lugares'}</h2>
              <label className="directory-search">
                Buscar por nombre
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <p role="status">{entries.length} fichas</p>
            </div>
            <ol>
              {entries.map((entity) => (
                <li key={entity.id}>
                  <button
                    type="button"
                    data-entity-id={entity.id}
                    onClick={() => selectEvent('', entity.id)}
                  >
                    <strong>{entity.name}</strong>
                    <Icon name="arrow" />
                  </button>
                </li>
              ))}
            </ol>
            {!entries.length && <p>No hay fichas con ese nombre.</p>}
          </section>
        )}
        {(result || entityResult) && (
          <aside className="atlas-detail" aria-labelledby="detail-heading">
            <div className="detail-toolbar">
              <h2 id="detail-heading" ref={detailHeading} tabIndex={-1}>
                {entityResult
                  ? 'Ficha del dossier'
                  : result?.status === 'visible'
                    ? preview
                      ? 'Fragmento de Genshin Impact'
                      : 'Acontecimiento'
                    : 'Detalle del archivo'}
              </h2>
              <button
                type="button"
                className="atlas-icon-button"
                aria-label="Cerrar detalle"
                onClick={closeDetail}
              >
                <Icon name="close" />
              </button>
            </div>
            {entityResult ? (
              entityResult.status === 'visible' ? (
                <article className="panel detail">
                  {selectedId && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => selectEvent(selectedId)}
                    >
                      Volver al acontecimiento
                    </button>
                  )}
                  <p className="metadata">
                    {entityResult.entity.kind === 'character'
                      ? 'Personaje / grupo'
                      : 'Lugar / ámbito'}{' '}
                    · Borrador visible
                  </p>
                  <h3>{entityResult.entity.name}</h3>
                  {entityResult.entity.body && (
                    <DossierText
                      text={entityResult.entity.body}
                      onNavigate={navigateRelation}
                    />
                  )}
                  {entityResult.entity.dossierSection && (
                    <a href={dossierHref(entityResult.entity.dossierSection)}>
                      Leer el apartado en su contexto
                    </a>
                  )}
                  <h4>Acontecimientos relacionados</h4>
                  <ul className="detail-list">
                    {entityResult.events.map((event) => (
                      <li key={event.id}>
                        <a href={'/?id=' + event.id} onClick={navigateRelation}>
                          {event.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {!entityResult.events.length && (
                    <p>Sin acontecimientos vinculados en este borrador.</p>
                  )}
                </article>
              ) : (
                <p className="detail-message" role="status">
                  {entityResult.status === 'blocked'
                    ? 'Contenido no disponible con tu progreso actual.'
                    : 'No se encontró la ficha solicitada.'}
                </p>
              )
            ) : result?.status === 'visible' ? (
              <Detail event={result.event} onNavigate={navigateRelation} />
            ) : (
              <div className="detail-message" role="status">
                <Icon name="compass" />
                <p>
                  {result?.status === 'blocked'
                    ? 'Contenido no disponible con tu progreso actual.'
                    : 'No se encontró el evento solicitado.'}
                </p>
                {!dossier && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setMenuOpen(true)}
                  >
                    Revisar progreso
                  </button>
                )}
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
                setDirectory(null);
                setMenuOpen(false);
              }}
            >
              <Icon name="compass" />
              Cronología
              <Icon name="arrow" />
            </button>
            {dossier ? (
              <>
                {(['character', 'place'] as const).map((kind) => (
                  <button
                    className="menu-current"
                    type="button"
                    key={kind}
                    onClick={() => {
                      setDirectory(kind);
                      setListOpen(false);
                      setQuery('');
                      setMenuOpen(false);
                    }}
                  >
                    {kind === 'character' ? 'Personajes' : 'Lugares'}
                    <Icon name="arrow" />
                  </button>
                ))}
                <a className="menu-current" href="/dossier/guia/">
                  Guía, fuentes y alcance
                  <Icon name="arrow" />
                </a>
                <a className="menu-current" href="/lista/">
                  Lista de acontecimientos
                  <Icon name="arrow" />
                </a>
              </>
            ) : (
              ['Personajes', 'Ubicaciones', 'Otros datos'].map((label) => (
                <div className="menu-future" key={label}>
                  <span>{label}</span>
                  <small>Próximamente</small>
                </div>
              ))
            )}
          </nav>
          {!dossier && (
            <details className="menu-progress">
              <summary>Progreso de lectura</summary>
              <p>
                {preview
                  ? 'Esta vista previa muestra todos los fragmentos seleccionados y puede contener spoilers.'
                  : 'Marca solo las lecturas que quieras revelar en esta demostración.'}
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
          )}
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
              {dossier
                ? 'Primer borrador basado en el dossier. Todo el contenido es visible; los filtros de spoilers se incorporarán más adelante.'
                : preview
                  ? 'Textos de Genshin Impact. Las posiciones y conexiones son provisionales, solo para probar el diseño.'
                  : 'Contenido ficticio para explorar la estructura. No representa lore de Genshin Impact.'}
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
