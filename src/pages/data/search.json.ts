import type { APIRoute } from 'astro';
import { loadAtlasContent } from '../../content/corpora';
import { buildAtlasData } from '../../content/atlas-data';

export const GET: APIRoute = async () =>
  Response.json(buildAtlasData(await loadAtlasContent()).search);
