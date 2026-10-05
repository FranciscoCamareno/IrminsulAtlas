import type { APIRoute, GetStaticPaths } from 'astro';
import { loadAtlasContent } from '../../../content/corpora';
import { buildAtlasData } from '../../../content/atlas-data';

export const getStaticPaths = (async () => {
  const { events } = buildAtlasData(await loadAtlasContent());
  return [...events].map(([id, detail]) => ({
    params: { id },
    props: { detail },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.detail);
