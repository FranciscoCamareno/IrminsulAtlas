import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import DossierText, { dossierHref } from './DossierText';
import type { Dataset } from '../domain/schema';
import {
  getEventById,
  listProgressOptions,
  listVisibleEvents,
  type EventDetail,
  type EventSummary,
} from '../application/catalog';

const claimLabels = {
  fact: 'Hecho',
  interpretation: 'Interpretación',
  theory: 'Teoría',
};
const relationLabels = {
  association: 'Asociación',
  precedes: 'Anterioridad',
  causes: 'Causalidad',
  mentions: 'Mención',
};
const editorialLabels = {
  demo: 'Demostración',
  draft: 'Borrador',
  provisional: 'Borrador visible',
  reviewed: 'Revisado',
};
const claimKindLabels = {
  explicit: 'Dato explícito',
  testimony: 'Testimonio',
  interpretation: 'Interpretación',
  unknown: 'Cuestión abierta',
};
const reviewLabels = {
  pending: 'Revisión pendiente',
  reviewed: 'Revisada',
  disputed: 'En disputa',
};
const tierLabels = {
  primary: 'Texto del juego',
  secondary: 'Fuente secundaria',
  dossier: 'Dossier',
};
const stanceLabels = {
  supports: 'Respalda',
  contradicts: 'Contradice',
  context: 'Da contexto',
};
const eventHref = (id: string) => `/evento/?id=${encodeURIComponent(id)}`;
const currentLocation = () => window.location.pathname + window.location.search;
function subscribeLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function navigate(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  window.history.pushState(null, '', event.currentTarget.href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function EventMeta({ event }: { event: EventSummary }) {
  return (
    <>
      <p className="metadata">
        {event.eraName} · {event.timeLabel}
      </p>
      <div className="tags">
        <span className="tag">
          {event.id.startsWith('preview-')
            ? 'Vista previa'
            : editorialLabels[event.editorialStatus]}
        </span>
        <span className="tag">
          {event.id.startsWith('preview-')
            ? 'Material fuente'
            : event.editorialStatus === 'provisional'
              ? event.id.startsWith('evt-viajero-')
                ? 'Resumen del acto'
                : 'Síntesis del dossier'
              : claimLabels[event.claimStatus]}
        </span>
        <span className="tag">
          {event.importance === 'major' ? 'Principal' : 'Secundario'}
        </span>
        {event.certainty?.map((certainty) => (
          <span className="tag" key={certainty}>
            {
              {
                documented: event.id.startsWith('evt-viajero-')
                  ? 'Documentado en los diálogos'
                  : 'Documentado en el dossier',
                tradition: 'Testimonio o tradición',
                approximate: 'Aproximado',
                disputed: 'Discutido',
                unknown: 'Sin datación exacta',
              }[certainty]
            }
          </span>
        ))}
      </div>
    </>
  );
}

export function Detail({
  event,
  onNavigate = navigate,
  labelFor,
}: {
  event: EventDetail;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  labelFor?: (id: string) => string | null;
}) {
  return (
    <article className="panel detail">
      <h3>{event.title}</h3>
      <EventMeta event={event} />
      {event.dossierSection ? (
        <>
          <p className="metadata">
            {event.narrativeThread} · {event.categories.join(' · ')}
          </p>
          <DossierText
            text={event.body}
            onNavigate={onNavigate}
            labelFor={labelFor}
          />
          <a href={dossierHref(event.dossierSection)}>
            Leer el apartado en su contexto
          </a>
        </>
      ) : (
        <>
          <p>{event.summary}</p>
          <p style={{ whiteSpace: 'pre-line' }}>{event.body}</p>
        </>
      )}
      <h4>Personajes y lugares relacionados</h4>
      {event.entities.length ? (
        <ul>
          {event.entities.map((entity) => (
            <li key={entity.id}>
              {event.dossierSection ? (
                <a
                  href={'/?id=' + event.id + '&entity=' + entity.id}
                  data-entity-id={entity.id}
                  onClick={onNavigate}
                >
                  {entity.name}
                </a>
              ) : (
                entity.name
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Sin participantes visibles.</p>
      )}
      <h4>Relaciones visibles</h4>
      {event.relations.length ? (
        <ul className="detail-list">
          {event.relations.map((relation) => {
            const other =
              relation.from.id === event.id ? relation.to : relation.from;
            return (
              <li key={relation.id}>
                <a href={eventHref(other.id)} onClick={onNavigate}>
                  {other.title}
                </a>
                <p>
                  {event.id.startsWith('preview-')
                    ? 'Conexión ilustrativa'
                    : relationLabels[relation.kind]}{' '}
                  · {claimLabels[relation.claimStatus]}
                </p>
                {relation.directed && (
                  <p>
                    Dirección: {relation.from.title} → {relation.to.title}
                  </p>
                )}
                <p>{relation.explanation}</p>
                {relation.evidence.map((evidence, index) => (
                  <p key={`${evidence.sourceId}-${index}`}>
                    Fuente: {evidence.sourceTitle} · {evidence.locator}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Sin relaciones visibles con este progreso.</p>
      )}
      {event.claims && event.claims.length > 0 && (
        <>
          <h4>Afirmaciones y respaldo</h4>
          <p className="metadata">
            Cada afirmación indica qué clase de enunciado es y qué la respalda.
            «Contrastada» significa que se comprobó el fragmento; «citada», que
            la fuente es la que menciona el dossier pero no se ha vuelto a leer.
            Una interpretación o una cuestión abierta no es un dato.
          </p>
          <ul className="detail-list claim-list">
            {event.claims.map((claim) => (
              <li key={claim.id} data-claim-id={claim.id}>
                <p className="metadata">
                  {claimKindLabels[claim.kind]} ·{' '}
                  {reviewLabels[claim.reviewStatus]}
                </p>
                <p>{claim.text}</p>
                {claim.supports.length === 0 ? (
                  <p className="metadata">
                    Sin fuente que la respalde: es una lectura editorial o una
                    pregunta que las fuentes dejan abierta.
                  </p>
                ) : (
                  <ul>
                    {claim.supports.map((support, index) => (
                      <li key={index}>
                        <strong>
                          {support.sourceUrl ? (
                            <a href={support.sourceUrl} rel="noreferrer">
                              {support.sourceTitle}
                            </a>
                          ) : (
                            support.sourceTitle
                          )}
                        </strong>
                        <p className="metadata">
                          {tierLabels[support.tier]} ·{' '}
                          {stanceLabels[support.stance]} ·{' '}
                          {support.verification === 'verified'
                            ? 'Contrastada con el fragmento'
                            : 'Citada, sin contrastar'}{' '}
                          · {support.locator}
                        </p>
                        <p>Límites: {support.limits}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <h4>Fuentes y evidencia</h4>
      {event.evidence.length ? (
        <ul className="detail-list">
          {event.evidence.map((evidence, index) => (
            <li key={`${evidence.sourceId}-${index}`}>
              <strong>
                {evidence.sourceUrl ? (
                  <a href={evidence.sourceUrl} rel="noreferrer">
                    {evidence.sourceTitle}
                  </a>
                ) : (
                  evidence.sourceTitle
                )}
              </strong>
              <p className="metadata">
                {evidence.locator} · {evidence.availability}
              </p>
              <p>
                {evidence.availability === 'Texto del dossier'
                  ? 'Origen del texto'
                  : evidence.availability ===
                      'Referencia externa sin contrastar'
                    ? 'Citada, sin contrastar'
                    : evidence.stance === 'supports'
                      ? 'Respalda'
                      : 'Contradice'}
                : {evidence.claim}
              </p>
              {evidence.note && <p>{evidence.note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p>Sin fuentes visibles con este progreso.</p>
      )}
    </article>
  );
}

export default function DemoCatalog({
  dataset,
  detailPage = false,
}: {
  dataset: Dataset;
  detailPage?: boolean;
}) {
  const dossier = dataset.universes.some(
    (universe) => universe.id === 'genshin',
  );
  const preview = dataset.universes.some(
    (universe) => universe.id === 'genshin-preview',
  );
  const [completed, setCompleted] = useState<string[]>([]);
  const location = useSyncExternalStore(
    subscribeLocation,
    currentLocation,
    () => (detailPage ? '/evento/' : '/'),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const previousLocation = useRef(location);
  useEffect(() => {
    if (previousLocation.current !== location) heading.current?.focus();
    previousLocation.current = location;
  }, [location]);
  const progress = new Set(completed);
  const events = listVisibleEvents(dataset, progress);
  const options = listProgressOptions(dataset);
  const isDetail = location.split('?')[0]?.replace(/\/$/, '') === '/evento';
  const id = new URLSearchParams(location.split('?')[1] ?? '').get('id');
  const result = id ? getEventById(dataset, id, progress) : undefined;

  return (
    <div
      className="catalog"
      style={preview || dossier ? { gridTemplateColumns: '1fr' } : undefined}
    >
      {!preview && !dossier && (
        <aside className="progress-panel">
          <fieldset aria-describedby="progress-help">
            <legend>Tu progreso de lectura</legend>
            <p id="progress-help">
              Marca las lecturas completadas para permitir su contenido de
              demostración.
            </p>
            {options.map((option) => (
              <label className="progress-option" key={option.id}>
                <input
                  type="checkbox"
                  checked={completed.includes(option.id)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setCompleted((previous) =>
                      checked
                        ? [...previous, option.id]
                        : previous.filter((value) => value !== option.id),
                    );
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <p className="progress-note">
            El progreso se conserva al navegar aquí y se reinicia al recargar.
          </p>
          <noscript>
            <p>
              Activa JavaScript para cambiar el progreso y abrir detalles. La
              lista inicial muestra solo contenido permitido sin progreso.
            </p>
          </noscript>
        </aside>
      )}
      <section aria-labelledby="catalog-title">
        <div className="section-heading">
          <h2 id="catalog-title" ref={heading} tabIndex={-1}>
            {isDetail ? 'Detalle del archivo' : 'Explorar el archivo'}
          </h2>
          {!isDetail && (
            <p className="metadata" role="status">
              {events.length}{' '}
              {preview ? 'fuentes en la vista previa' : 'eventos visibles'}
            </p>
          )}
        </div>
        {isDetail ? (
          <>
            <a className="back-link" href="/" onClick={navigate}>
              ← Volver a la lista
            </a>
            {!result && (
              <div className="panel">
                <p>Selecciona un evento de la lista para consultar su ficha.</p>
              </div>
            )}
            {result?.status === 'not-found' && (
              <div className="panel">
                <p>No se encontró el evento solicitado.</p>
              </div>
            )}
            {result?.status === 'blocked' && (
              <div className="panel" role="status">
                <p>Contenido no disponible con tu progreso actual.</p>
                <p>Puedes revisar tus lecturas o volver a la lista.</p>
              </div>
            )}
            {result?.status === 'visible' && <Detail event={result.event} />}
          </>
        ) : (
          <>
            <p className="reading-note">
              {preview
                ? 'Colección de fuentes de Genshin Impact. La distribución temporal está pendiente.'
                : 'Orden editorial por épocas. Las fechas conservan su incertidumbre; esta lista no representa duraciones.'}
            </p>
            {events.length ? (
              <ul className="event-list">
                {events.map((event) => (
                  <li className="panel" key={event.id}>
                    <EventMeta event={event} />
                    <h3>
                      <a
                        href={eventHref(event.id)}
                        onClick={dossier ? undefined : navigate}
                      >
                        {event.title}
                      </a>
                    </h3>
                    <DossierText text={event.summary} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel">
                <p>No hay eventos visibles con este progreso.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
