import {
  emptyFilters,
  parseFilters,
  writeFilters,
  type AtlasFilters,
} from '../../application/atlas';

export type ViewMode = '' | 'lista' | 'personajes' | 'lugares';
export interface UrlState {
  id: string;
  entity: string;
  view: ViewMode;
  filters: AtlasFilters;
}
export const emptyUrlState: UrlState = {
  id: '',
  entity: '',
  view: '',
  filters: emptyFilters,
};

// The address is the single place that remembers selection, view and filters,
// so reload and back/forward restore them; progress lives in local storage.
export function parseUrl(search: string): UrlState {
  const params = new URLSearchParams(search);
  const view = params.get('vista');
  return {
    id: params.get('id') ?? '',
    entity: params.get('entity') ?? '',
    view:
      view === 'lista' || view === 'personajes' || view === 'lugares'
        ? view
        : '',
    filters: parseFilters(params),
  };
}

export function buildUrl(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.id) params.set('id', state.id);
  if (state.entity) params.set('entity', state.entity);
  if (state.view) params.set('vista', state.view);
  writeFilters(params, state.filters);
  return '/' + (params.size ? '?' + params : '');
}
