import type { APIRoute, GetStaticPaths } from 'astro';
import { loadDossierDocuments } from '../../../content/dossier';

export const getStaticPaths = (async () =>
  (await loadDossierDocuments()).map(({ id, title, body }) => ({
    params: { id },
    props: { document: { schemaVersion: 1, id, title, body } },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.document);
