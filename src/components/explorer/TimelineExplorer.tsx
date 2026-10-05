import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import {
  assembleEntity,
  assembleEvent,
  entityAvailability,
  eventAvailability,
  filterEntities,
  filterEvents,
  filterOptions,
  hasFilters,
  sanitizeFilters,
  timelineContent,
  visibleView,
  type AtlasFilters,
} from '../../application/atlas';
import {
  createFetchSource,
  type AtlasSource,
} from '../../application/data-source';
import {
  choiceFromSnapshot,
  getChoiceSnapshot,
  getServerChoiceSnapshot,
  isValidChoice,
  progressSet,
  storeChoice,
  subscribeChoice,
  type ProgressChoice,
} from '../../application/progress';
import { Detail } from '../DemoCatalog';
import DossierText, { dossierHref } from '../DossierText';
import TimelineCanvas from './TimelineCanvas';
import ProgressDialog, { choiceLabel } from './ProgressDialog';
import SearchPanel from './SearchPanel';
import Icon from './Icon';
import { useAsync } from './useAsync';
import { buildUrl, parseUrl, type UrlState, type ViewMode } from './url-state';

const subscribeLocation = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};
const readSelection = () => window.location.search;
const serverSelection = () => '';

function LoadFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="detail-message" role="alert">
      <Icon name="compass" />
      <p>{message}</p>
      <button type="button" className="text-button" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

export default function TimelineExplorer({
  source: provided,
}: {
  source?: AtlasSource;
}) {
  const source = useMemo(() => provided ?? createFetchSource(), [provided]);
  const [indexState, retryIndex] = useAsync('index', () => source.index());
  const index = indexState.status === 'ready' ? indexState.data : null;

  // Progress is decided in the browser; until it is, nothing beyond the
  // neutral shell is visible. `null` means the reader has not chosen yet.
  const rawChoice = useSyncExternalStore(
    subscribeChoice,
    getChoiceSnapshot,
    getServerChoiceSnapshot,
  );
  const storedChoice = useMemo(
    () => choiceFromSnapshot(rawChoice),
    [rawChoice],
  );
  const choice = useMemo<ProgressChoice | null>(
    () =>
      index && storedChoice && isValidChoice(storedChoice, index.milestones)
        ? storedChoice
        : null,
    [index, storedChoice],
  );
  const [progressOpen, setProgressOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const undecided = !!index && choice === null && !declined;

  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const selection = useSyncExternalStore(
    subscribeLocation,
    readSelection,
    serverSelection,
  );
  const url = useMemo(() => parseUrl(selection), [selection]);
  const { id: selectedId, entity: entityId, view: mode } = url;
  const view = useMemo(
    () =>
      index
        ? visibleView(
            index,
            progressSet(choice ?? { kind: 'none' }, index.milestones),
          )
        : null,
    [index, choice],
  );
  const options = useMemo(() => (view ? filterOptions(view) : null), [view]);
  const sanitized = useMemo(
    () => (options ? sanitizeFilters(url.filters, options) : null),
    [options, url.filters],
  );
  const filters: AtlasFilters = sanitized?.filters ?? url.filters;

  // Full text is fetched only when something is actually searched.
  const searching = !!filters.q;
  const [searchState] = useAsync(searching ? 'search' : null, () =>
    source.search(),
  );
  const bodies = useMemo(
    () =>
      searchState.status === 'ready'
        ? new Map([
            ...searchState.data.events.map(
              (item) => [item.id, item.text] as const,
            ),
            ...searchState.data.entities.map(
              (item) => [item.id, item.text] as const,
            ),
          ])
        : undefined,
    [searchState],
  );
  const fullText = !searching
    ? 'idle'
    : searchState.status === 'ready'
      ? 'ready'
      : searchState.status === 'error'
        ? 'error'
        : 'loading';

  const filtered = useMemo(
    () => (view ? filterEvents(view, filters, bodies) : []),
    [view, filters, bodies],
  );
  const content = useMemo(
    () => (view ? timelineContent(view, filtered) : null),
    [view, filtered],
  );
  const canvasKey = filtered.map((event) => event.id).join('|');

  const eventState =
    view && selectedId ? eventAvailability(view, selectedId) : null;
  const entityState =
    view && entityId ? entityAvailability(view, entityId) : null;
  const [eventFile, retryEvent] = useAsync(
    eventState === 'visible' ? 'event:' + selectedId : null,
    () => source.event(selectedId),
  );
  const [entityFile, retryEntity] = useAsync(
    entityState === 'visible' ? 'entity:' + entityId : null,
    () => source.entity(entityId),
  );
  const eventDetail =
    view && eventFile.status === 'ready'
      ? assembleEvent(view, eventFile.data)
      : null;
  const entityDetail =
    view && entityFile.status === 'ready'
      ? assembleEntity(view, entityFile.data)
      : null;
  const directoryEntries =
    view && (mode === 'personajes' || mode === 'lugares')
      ? filterEntities(
          view,
          mode === 'personajes' ? 'character' : 'place',
          filters.q,
          bodies,
        )
      : [];

  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const previousSelection = useRef('');
  const previousEntity = useRef('');
  const listOpen = mode === 'lista';
  const directory =
    mode === 'personajes' ? 'character' : mode === 'lugares' ? 'place' : null;

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
  }, [selectedId, entityId, listOpen]);

  function go(patch: Partial<UrlState>, mode: 'push' | 'replace' = 'push') {
    const next = buildUrl({ ...url, ...patch });
    if (next !== window.location.pathname + window.location.search) {
      if (mode === 'push') window.history.pushState(null, '', next);
      else window.history.replaceState(null, '', next);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
  function selectEvent(id: string, entity = '') {
    go({ id, entity });
  }
  function closeDetail() {
    go(entityId ? { entity: '' } : { id: '', entity: '' });
  }
  function setView(next: ViewMode) {
    go({
      view: next,
      id: '',
      entity: '',
      filters:
        next === 'personajes' || next === 'lugares'
          ? { ...url.filters, q: '' }
          : url.filters,
    });
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
  function applyChoice(next: ProgressChoice) {
    setDeclined(false);
    storeChoice(next);
    setProgressOpen(false);
  }
  function cancelProgress() {
    if (undecided) setDeclined(true);
    setProgressOpen(false);
  }
  // Inline IDs inside prose show a title only when its target is visible.
  const labelFor = (target: string) => {
    if (!view) return null;
    if (target.startsWith('evt-'))
      return view.eventById.get(target)?.title ?? null;
    return view.entityById.get(target)?.name ?? null;
  };

  const total = view?.events.length ?? 0;
  const status =
    indexState.status === 'ready'
      ? null
      : indexState.status === 'error'
        ? 'error'
        : 'loading';

  return (
    <div
      ref={shell}
      className={`atlas-shell ${light ? 'atlas-light' : ''}`}
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          !menuOpen &&
          !progressOpen &&
          (selectedId || entityId)
        ) {
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
          {index && (
            <button
              type="button"
              className="atlas-icon-button progress-trigger"
              aria-label={
                'Progreso de lectura: ' +
                choiceLabel(choice, index.milestones) +
                '. Cambiar'
              }
              onClick={() => setProgressOpen(true)}
            >
              <Icon name="eye" />
              <span>{choiceLabel(choice, index.milestones)}</span>
            </button>
          )}
          <button
            type="button"
            ref={searchButton}
            className="atlas-icon-button"
            aria-label="Buscar y filtrar"
            aria-expanded={searchOpen}
            aria-controls="search-region"
            aria-pressed={searchOpen || hasFilters(filters)}
            disabled={!view}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="atlas-icon-button"
            aria-label={
              listOpen ? 'Mostrar cronología' : 'Mostrar vista de lista'
            }
            aria-pressed={listOpen}
            title="Alternar cronología y lista"
            disabled={!view}
            onClick={() => setView(listOpen ? '' : 'lista')}
          >
            <Icon name={listOpen ? 'compass' : 'list'} />
          </button>
        </div>
      </header>
      {view && options && searchOpen && (
        <div id="search-region" className="search-region">
          <SearchPanel
            filters={filters}
            options={options}
            ignored={sanitized?.ignored ?? []}
            resultCount={filtered.length}
            totalCount={total}
            fullText={fullText}
            onChange={(next) => go({ filters: next }, 'replace')}
          />
        </div>
      )}
      <div
        className={`atlas-workspace ${selectedId || entityId ? 'has-detail' : ''}`}
      >
        <h1 className="sr-only">Cronología interactiva de Irminsul Atlas</h1>
        {status && (
          <div className="atlas-status">
            {status === 'loading' ? (
              <p role="status">Cargando el atlas…</p>
            ) : (
              <LoadFailure
                message="No se pudo cargar el atlas. Comprueba tu conexión e inténtalo de nuevo."
                onRetry={retryIndex}
              />
            )}
          </div>
        )}
        {content && view && (
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
              key={canvasKey}
              dossier={index?.universe.id === 'genshin'}
              content={content}
              selectedId={eventState === 'visible' ? selectedId : null}
              onSelect={selectEvent}
            />
          </div>
        )}
        {view && !filtered.length && !directory && (
          <div className="atlas-empty" role="status">
            <p>
              {total === 0
                ? 'Con tu progreso actual aún no hay acontecimientos disponibles.'
                : 'Ningún acontecimiento coincide con la búsqueda y los filtros.'}
            </p>
            {total === 0 ? (
              <button
                type="button"
                className="text-button"
                onClick={() => setProgressOpen(true)}
              >
                Cambiar progreso
              </button>
            ) : (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  go(
                    {
                      filters: {
                        q: '',
                        era: '',
                        region: '',
                        entity: '',
                        type: '',
                      },
                    },
                    'replace',
                  )
                }
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
        {view && listOpen && !directory && (
          <section className="atlas-list" aria-label="Vista de lista">
            <div className="atlas-list-heading">
              <span className="atlas-kicker">
                Genshin Impact · Historia antigua
              </span>
              <h2>Acontecimientos</h2>
              <p role="status">
                {hasFilters(filters)
                  ? filtered.length + ' de ' + total + ' acontecimientos'
                  : filtered.length + ' acontecimientos'}
              </p>
            </div>
            <ol>
              {content?.events.map((event) => (
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
        {view && directory && (
          <section
            className="atlas-list"
            aria-label={directory === 'character' ? 'Personajes' : 'Lugares'}
          >
            <div className="atlas-list-heading">
              <span className="atlas-kicker">Dossier · Primer borrador</span>
              <h2>{directory === 'character' ? 'Personajes' : 'Lugares'}</h2>
              <label className="directory-search">
                Buscar
                <input
                  type="search"
                  value={filters.q}
                  onChange={(event) =>
                    go(
                      { filters: { ...url.filters, q: event.target.value } },
                      'replace',
                    )
                  }
                />
              </label>
              <p role="status">{directoryEntries.length} fichas</p>
            </div>
            <ol>
              {directoryEntries.map((entity) => (
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
            {!directoryEntries.length && (
              <p>No hay fichas con esa búsqueda con tu progreso actual.</p>
            )}
          </section>
        )}
        {view && (eventState || entityState) && (
          <aside className="atlas-detail" aria-labelledby="detail-heading">
            <div className="detail-toolbar">
              <h2 id="detail-heading" ref={detailHeading} tabIndex={-1}>
                {entityId
                  ? 'Ficha del dossier'
                  : eventState === 'visible'
                    ? 'Acontecimiento'
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
            {entityId ? (
              entityState === 'visible' ? (
                entityFile.status === 'error' ? (
                  <LoadFailure
                    message={entityFile.message}
                    onRetry={retryEntity}
                  />
                ) : entityDetail ? (
                  <article className="panel detail">
                    {selectedId && eventState === 'visible' && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => selectEvent(selectedId)}
                      >
                        Volver al acontecimiento
                      </button>
                    )}
                    <p className="metadata">
                      {entityDetail.entity.kind === 'character'
                        ? 'Personaje / grupo'
                        : 'Lugar / ámbito'}{' '}
                      · Borrador visible
                    </p>
                    <h3>{entityDetail.entity.name}</h3>
                    {entityDetail.entity.body && (
                      <DossierText
                        text={entityDetail.entity.body}
                        onNavigate={navigateRelation}
                        labelFor={labelFor}
                      />
                    )}
                    {entityDetail.entity.dossierSection && (
                      <a href={dossierHref(entityDetail.entity.dossierSection)}>
                        Leer el apartado en su contexto
                      </a>
                    )}
                    <h4>Acontecimientos relacionados</h4>
                    <ul className="detail-list">
                      {entityDetail.events.map((event) => (
                        <li key={event.id}>
                          <a
                            href={'/?id=' + event.id}
                            onClick={navigateRelation}
                          >
                            {event.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                    {!entityDetail.events.length && (
                      <p>
                        Sin acontecimientos vinculados con tu progreso actual.
                      </p>
                    )}
                  </article>
                ) : (
                  <p className="detail-message" role="status">
                    Cargando ficha…
                  </p>
                )
              ) : (
                <p className="detail-message" role="status">
                  {entityState === 'blocked'
                    ? 'Contenido no disponible con tu progreso actual.'
                    : 'No se encontró la ficha solicitada.'}
                </p>
              )
            ) : eventState === 'visible' ? (
              eventFile.status === 'error' ? (
                <LoadFailure message={eventFile.message} onRetry={retryEvent} />
              ) : eventDetail ? (
                <Detail
                  event={eventDetail}
                  onNavigate={navigateRelation}
                  labelFor={labelFor}
                />
              ) : (
                <p className="detail-message" role="status">
                  Cargando acontecimiento…
                </p>
              )
            ) : (
              <div className="detail-message" role="status">
                <Icon name="compass" />
                <p>
                  {eventState === 'blocked'
                    ? 'Contenido no disponible con tu progreso actual.'
                    : 'No se encontró el evento solicitado.'}
                </p>
                {eventState === 'blocked' && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setProgressOpen(true)}
                  >
                    Revisar progreso
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
      {index && (
        <ProgressDialog
          open={undecided || progressOpen}
          firstVisit={undecided}
          milestones={index.milestones}
          choice={choice}
          onApply={applyChoice}
          onCancel={cancelProgress}
        />
      )}
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
                setView('');
                setMenuOpen(false);
              }}
            >
              <Icon name="compass" />
              Cronología
              <Icon name="arrow" />
            </button>
            {(['personajes', 'lugares'] as const).map((kind) => (
              <button
                className="menu-current"
                type="button"
                key={kind}
                disabled={!view}
                onClick={() => {
                  setView(kind);
                  setMenuOpen(false);
                }}
              >
                {kind === 'personajes' ? 'Personajes' : 'Lugares'}
                <Icon name="arrow" />
              </button>
            ))}
            <button
              type="button"
              className="menu-current"
              disabled={!view}
              onClick={() => {
                setView('lista');
                setMenuOpen(false);
              }}
            >
              Lista de acontecimientos
              <Icon name="arrow" />
            </button>
            <button
              type="button"
              className="menu-current"
              disabled={!index}
              onClick={() => {
                setMenuOpen(false);
                setProgressOpen(true);
              }}
            >
              Progreso de lectura
              <Icon name="eye" />
            </button>
            <a className="menu-current" href="/dossier/guia/">
              Guía, fuentes y alcance
              <Icon name="arrow" />
            </a>
          </nav>
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
              Primer borrador basado en el dossier. El contenido se muestra
              según tu progreso; el filtro protege tu experiencia, no es un
              control de acceso.
            </p>
          </div>
        </div>
      </dialog>
      <noscript>
        <div className="atlas-noscript">
          Activa JavaScript para consultar la cronología: el contenido se
          muestra según tu progreso de lectura.
        </div>
      </noscript>
    </div>
  );
}
