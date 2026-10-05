import type { APIRoute, GetStaticPaths } from 'astro';
import { loadAtlasContent } from '../../../content/corpora';
import { buildAtlasData } from '../../../content/atlas-data';

export const getStaticPaths = (async () => {
  const { entities } = buildAtlasData(await loadAtlasContent());
  return [...entities].map(([id, detail]) => ({
    params: { id },
    props: { detail },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.detail);
