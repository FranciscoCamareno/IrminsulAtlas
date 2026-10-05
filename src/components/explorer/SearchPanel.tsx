import { useId } from 'react';
import {
  hasFilters,
  type AtlasFilters,
  type FilterOptions,
} from '../../application/atlas';

export default function SearchPanel({
  filters,
  options,
  ignored,
  resultCount,
  totalCount,
  fullText,
  onChange,
}: {
  filters: AtlasFilters;
  options: FilterOptions;
  ignored: string[];
  resultCount: number;
  totalCount: number;
  fullText: 'idle' | 'loading' | 'ready' | 'error';
  onChange: (filters: AtlasFilters) => void;
}) {
  const id = useId();
  const set = (patch: Partial<AtlasFilters>) =>
    onChange({ ...filters, ...patch });
  return (
    <form
      className="search-panel"
      role="search"
      aria-label="Buscar y filtrar acontecimientos"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="search-field" htmlFor={id + '-q'}>
        <span>Buscar</span>
        <input
          id={id + '-q'}
          type="search"
          value={filters.q}
          placeholder="Nombre, personaje, lugar o tema"
          autoComplete="off"
          onChange={(event) => set({ q: event.target.value })}
        />
      </label>
      <label htmlFor={id + '-era'}>
        <span>Capítulo</span>
        <select
          id={id + '-era'}
          value={filters.era}
          onChange={(event) => set({ era: event.target.value })}
        >
          <option value="">Todos</option>
          {options.eras.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name} ({era.count})
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id + '-region'}>
        <span>Región o ámbito</span>
        <select
          id={id + '-region'}
          value={filters.region}
          onChange={(event) => set({ region: event.target.value })}
        >
          <option value="">Todos</option>
          {options.regions.map((region) => (
            <option key={region.name} value={region.name}>
              {region.name} ({region.count})
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id + '-entity'}>
        <span>Personaje o lugar</span>
        <select
          id={id + '-entity'}
          value={filters.entity}
          onChange={(event) => set({ entity: event.target.value })}
        >
          <option value="">Todos</option>
          {options.entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name} ({entity.count})
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id + '-type'}>
        <span>Tipo</span>
        <select
          id={id + '-type'}
          value={filters.type}
          onChange={(event) =>
            set({ type: event.target.value as AtlasFilters['type'] })
          }
        >
          <option value="">Todos</option>
          <option value="major">Principales ({options.types.major})</option>
          <option value="minor">Secundarios ({options.types.minor})</option>
        </select>
      </label>
      <div className="search-status">
        <p role="status">
          {hasFilters(filters)
            ? resultCount + ' de ' + totalCount + ' acontecimientos'
            : totalCount + ' acontecimientos disponibles'}
        </p>
        {filters.q && fullText === 'error' && (
          <p>
            La búsqueda en el texto completo no está disponible; se muestran
            coincidencias por nombre.
          </p>
        )}
        {ignored.length > 0 && (
          <p>
            Se ignoró un filtro de la dirección que no existe con tu progreso:{' '}
            {ignored.join(', ')}.
          </p>
        )}
        {hasFilters(filters) && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              onChange({ q: '', era: '', region: '', entity: '', type: '' })
            }
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </form>
  );
}
