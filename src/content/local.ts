import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import {
  DatasetSchema,
  EditorialContentSchema,
  MissionSchema,
  type Dataset,
  type Mission,
} from '../domain/schema';
import { findIntegrityIssues } from '../domain/integrity';

// Future provider adapters implement only this normalized output contract.
// Their response parsing/authentication belongs outside the domain and browser.
export interface MissionProvider {
  loadMissions(): Promise<readonly Mission[]>;
}

async function readJson(url: URL): Promise<unknown> {
  try {
    return JSON.parse(await readFile(url, 'utf8')) as unknown;
  } catch (cause) {
    throw new Error(`No se pudo leer JSON local: ${url.pathname}`, { cause });
  }
}

function parseFile<T>(schema: z.ZodType<T>, input: unknown, path: string): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error(`${path}: ${result.error.message}`);
  return result.data;
}

// Commands run from the project root; this remains stable in Astro's build bundle.
const editorialUrl = pathToFileURL(resolve('content/editorial/demo.json'));
const missionsUrl = pathToFileURL(
  resolve('content/imported/demo-missions.json'),
);

export const localMissionProvider: MissionProvider = {
  async loadMissions() {
    return parseFile(
      z.array(MissionSchema),
      await readJson(missionsUrl),
      missionsUrl.pathname,
    );
  },
};

export async function loadLocalContent(
  provider: MissionProvider = localMissionProvider,
): Promise<Dataset> {
  const [rawEditorial, sources] = await Promise.all([
    readJson(editorialUrl),
    provider.loadMissions(),
  ]);
  const editorial = parseFile(
    EditorialContentSchema,
    rawEditorial,
    editorialUrl.pathname,
  );
  // Revalidate adapter output at the boundary even when its TypeScript contract is satisfied.
  const data = parseFile(
    DatasetSchema,
    { ...editorial, sources },
    'Contenido combinado (editorial + fuentes)',
  );
  const issues = findIntegrityIssues(data);
  if (issues.length) {
    throw new Error(
      `Integridad de ${editorialUrl.pathname} + fuentes:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')}`,
    );
  }
  return data;
}
