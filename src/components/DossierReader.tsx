import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createFetchSource } from '../application/data-source';
import {
  choiceFromSnapshot,
  getChoiceSnapshot,
  getServerChoiceSnapshot,
  storeChoice,
  subscribeChoice,
} from '../application/progress';
import DossierText from './DossierText';
import { useAsync } from './explorer/useAsync';

// The complete dossier documents cover the whole story, so they open only for
// readers who chose «Mostrar todo». Until then nothing of them is in the HTML.
export default function DossierReader({ id }: { id: string }) {
  const source = useMemo(() => createFetchSource(), []);
  // The server snapshot is "no choice", so the pre-rendered HTML never holds
  // anything but the neutral notice.
  const choice = choiceFromSnapshot(
    useSyncExternalStore(
      subscribeChoice,
      getChoiceSnapshot,
      getServerChoiceSnapshot,
    ),
  );
  const allowed = choice?.kind === 'all';
  const [file, retry] = useAsync(allowed ? 'document:' + id : null, () =>
    source.document(id),
  );
  useEffect(() => {
    if (file.status === 'ready' && window.location.hash)
      document
        .getElementById(decodeURIComponent(window.location.hash.slice(1)))
        ?.scrollIntoView();
  }, [file.status]);
  if (choice === undefined)
    return <p role="status">Comprobando tu progreso…</p>;
  if (!allowed)
    return (
      <div className="panel" role="status">
        <h2>Documento con spoilers</h2>
        <p>
          Este documento recorre toda la historia y puede revelar tramas que aún
          no has visto. Elige «Mostrar todo» para leerlo, o consulta la
          cronología, que respeta tu progreso.
        </p>
        <button
          type="button"
          className="text-button"
          onClick={() => storeChoice({ kind: 'all' })}
        >
          Mostrar todo y leer
        </button>{' '}
        <a href="/">Volver a la cronología</a>
      </div>
    );
  if (file.status === 'error')
    return (
      <div className="panel" role="alert">
        <p>{file.message}</p>
        <button type="button" className="text-button" onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  if (file.status !== 'ready') return <p role="status">Cargando documento…</p>;
  return <DossierText text={file.data.body} />;
}
