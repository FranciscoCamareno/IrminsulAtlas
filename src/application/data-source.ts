import type {
  AtlasIndex,
  DossierDocumentFile,
  EntityDetailFile,
  EventDetailFile,
  SearchIndex,
} from '../domain/schema';

// The explorer reads only through this interface. Production uses static files
// served with the site; tests and future adapters supply their own.
export interface AtlasSource {
  index(): Promise<AtlasIndex>;
  event(id: string): Promise<EventDetailFile>;
  entity(id: string): Promise<EntityDetailFile>;
  search(): Promise<SearchIndex>;
  document(id: string): Promise<DossierDocumentFile>;
}

export class AtlasLoadError extends Error {}

// The files are validated against the Zod schemas when the site is built, so
// the browser only checks that what arrived has the expected version and shape
// (truncated, stale or foreign files); this keeps Zod out of the client bundle.
function shape<T>(arrays: string[], id?: string) {
  return (value: unknown): T => {
    const record = value as Record<string, unknown> | null;
    if (
      typeof value !== 'object' ||
      record === null ||
      record.schemaVersion !== 1 ||
      (id !== undefined && record.id !== id) ||
      arrays.some((key) => !Array.isArray(record[key]))
    )
      throw new Error('formato inesperado');
    return value as T;
  };
}

export function createFetchSource(
  base = '/data',
  fetcher: typeof fetch = (...args) => fetch(...args),
): AtlasSource {
  const cache = new Map<string, Promise<unknown>>();
  // Failures are not cached, so "try again" really tries again.
  function load<T>(path: string, check: (value: unknown) => T): Promise<T> {
    const known = cache.get(path);
    if (known) return known as Promise<T>;
    const request = (async () => {
      let response: Response;
      try {
        response = await fetcher(base + path);
      } catch (cause) {
        throw new AtlasLoadError('Sin conexión con los datos del atlas.', {
          cause,
        });
      }
      if (!response.ok)
        throw new AtlasLoadError(
          'No se pudo cargar el archivo (' + response.status + ').',
        );
      try {
        // Remote data is untrusted: parse as data, never as markup or code.
        return check(await response.json());
      } catch (cause) {
        throw new AtlasLoadError('El archivo de datos no es válido.', {
          cause,
        });
      }
    })();
    cache.set(path, request);
    request.catch(() => cache.delete(path));
    return request;
  }
  return {
    index: () =>
      load('/index.json', shape<AtlasIndex>(['eras', 'events', 'entities'])),
    event: (id) =>
      load(
        '/events/' + encodeURIComponent(id) + '.json',
        shape<EventDetailFile>(['evidence', 'relations'], id),
      ),
    entity: (id) =>
      load(
        '/entities/' + encodeURIComponent(id) + '.json',
        shape<EntityDetailFile>([], id),
      ),
    search: () => load('/search.json', shape<SearchIndex>(['events'])),
    document: (id) =>
      load(
        '/documents/' + encodeURIComponent(id) + '.json',
        shape<DossierDocumentFile>([], id),
      ),
  };
}

// In-memory source over already-built data (tests, previews).
export function createMemorySource(data: {
  index: AtlasIndex;
  events: ReadonlyMap<string, EventDetailFile>;
  entities: ReadonlyMap<string, EntityDetailFile>;
  search: SearchIndex;
  documents?: ReadonlyMap<string, DossierDocumentFile>;
}): AtlasSource {
  const found = <T>(value: T | undefined, what: string) =>
    value === undefined
      ? Promise.reject(new AtlasLoadError('No existe ' + what))
      : Promise.resolve(value);
  return {
    index: () => Promise.resolve(data.index),
    event: (id) => found(data.events.get(id), id),
    entity: (id) => found(data.entities.get(id), id),
    search: () => Promise.resolve(data.search),
    document: (id) => found(data.documents?.get(id), id),
  };
}
