import type { APIRoute } from 'astro';
import { loadDossierContent } from '../../content/dossier';
import { buildAtlasData } from '../../content/atlas-data';

export const GET: APIRoute = async () =>
  Response.json(buildAtlasData(await loadDossierContent()).index);
