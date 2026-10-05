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
const claimKindLabels = {
  explicit: 'Dato explícito',
  testimony: 'Testimonio',
  interpretation: 'Interpretación',
  unknown: 'Cuestión abierta',
};
// Language tags on imported titles are for the archive, not for readers.
const readable = (title: string) => title.replace(/\s*\((?:ES|EN)\)$/, '');
function SourceNames({
  supports,
}: {
  supports: ReadonlyArray<{
    sourceTitle: string;
    sourceUrl?: string | undefined;
  }>;
}) {
  return supports.map((support, index) => (
    <span key={support.sourceTitle}>
      {index > 0 && '; '}
      {support.sourceUrl ? (
        <a href={support.sourceUrl} rel="noreferrer">
          {readable(support.sourceTitle)}
        </a>
      ) : (
        readable(support.sourceTitle)
      )}
    </span>
  ));
}
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
        {/* Synthetic and preview material stays identified; the editorial
            workflow state of real content is not shown to readers. */}
        {event.id.startsWith('preview-') ? (
          <span className="tag">Vista previa</span>
        ) : (
          event.editorialStatus === 'demo' && (
            <span className="tag">Demostración</span>
          )
        )}
        {event.id.startsWith('preview-') ? (
          <span className="tag">Material fuente</span>
        ) : (
          event.editorialStatus !== 'provisional' && (
            <span className="tag">{claimLabels[event.claimStatus]}</span>
          )
        )}
        <span className="tag">
          {event.importance === 'major' ? 'Principal' : 'Secundario'}
        </span>
        {event.certainty?.map((certainty) => (
          <span className="tag" key={certainty}>
            {
              {
                documented: event.id.startsWith('evt-viajero-')
                  ? 'Documentado en los diálogos'
                  : 'Documentado',
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
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Sin relaciones visibles con este progreso.</p>
      )}
      {event.claims && event.claims.length > 0 && (
        <>
          <h4>Qué se sabe</h4>
          <ul className="detail-list claim-list">
            {event.claims.map((claim) => {
              // Readers see what kind of statement it is and where it comes
              // from; locators, review state and limits stay in the data.
              const sources = (stance: 'supports' | 'contradicts') => [
                ...new Map(
                  claim.supports
                    .filter((support) =>
                      stance === 'contradicts'
                        ? support.stance === 'contradicts'
                        : support.stance !== 'contradicts',
                    )
                    .map((support) => [support.sourceTitle, support] as const),
                ).values(),
              ];
              const backing = sources('supports');
              const against = sources('contradicts');
              const fromGame = claim.supports.some(
                (support) =>
                  support.tier === 'primary' &&
                  support.stance !== 'contradicts',
              );
              return (
                <li key={claim.id} data-claim-id={claim.id}>
                  <p className="metadata">
                    {claimKindLabels[claim.kind]}
                    {claim.reviewStatus === 'disputed' && ' · En disputa'}
                  </p>
                  <p>{claim.text}</p>
                  {backing.length > 0 && (
                    <p className="metadata">
                      Fuente: <SourceNames supports={backing} />
                    </p>
                  )}
                  {against.length > 0 && (
                    <p className="metadata">
                      Lo contradice: <SourceNames supports={against} />
                    </p>
                  )}
                  {!fromGame && (
                    <p className="metadata">
                      {claim.supports.length === 0
                        ? 'Sin confirmación directa en el juego.'
                        : 'No está confirmado del todo por textos del juego.'}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <h4>Fuentes</h4>
      {event.evidence.length ? (
        <ul className="detail-list">
          {[
            ...new Map(
              event.evidence.map((evidence) => [evidence.sourceId, evidence]),
            ).values(),
          ].map((evidence) => (
            <li key={evidence.sourceId}>
              {evidence.sourceUrl ? (
                <a href={evidence.sourceUrl} rel="noreferrer">
                  {readable(evidence.sourceTitle)}
                </a>
              ) : (
                readable(evidence.sourceTitle)
              )}
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
