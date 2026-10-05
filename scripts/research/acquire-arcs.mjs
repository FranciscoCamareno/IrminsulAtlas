// N-11/N-12: fetches the quest and talk files of the selected Archon Quest
// chapters from the pinned provider commit, records their fingerprints in the
// P1 manifest (computed on download, as in the earlier extensions) and adds the
// main quests to the import selection. Idempotent; never touches lore content.
import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const { fetch, AbortSignal, setTimeout } = globalThis;
const manifestPath = 'docs/validation/p1/snapshot-manifest.json';
const selectionPath = 'scripts/import/selection.json';
const cache = resolve('.validation/p1/raw');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const selection = JSON.parse(readFileSync(selectionPath, 'utf8'));
const registry = JSON.parse(
  readFileSync('content/editorial/genshin-coverage.json', 'utf8'),
);
const exclude = new Set(
  (process.argv.find((arg) => arg.startsWith('--exclude=')) ?? '--exclude=')
    .slice('--exclude='.length)
    .split(',')
    .filter(Boolean)
    .map(Number),
);
const only = process.argv.find((arg) => arg.startsWith('--only='));
const onlySet = only ? new Set(only.slice(7).split(',').map(Number)) : null;
const known = new Map(manifest.files.map((file) => [file.path, file]));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const gitBlob = (bytes) =>
  createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
const gaps = [];

async function obtain(path) {
  const target = resolve(cache, path);
  if (existsSync(target)) {
    const bytes = readFileSync(target);
    const entry = known.get(path);
    if (entry && sha256(bytes) !== entry.sha256)
      throw new Error('Archivo local modificado: ' + path);
    if (!entry) register(path, bytes);
    return bytes;
  }
  const url = `https://raw.githubusercontent.com/DimbreathBot/AnimeGameData/${manifest.commit}/${path}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(60000),
        redirect: 'error',
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      register(path, bytes);
      return bytes;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((done) => setTimeout(done, 1000 * 2 ** attempt));
    }
  }
}
function register(path, bytes) {
  if (known.has(path)) return;
  const entry = {
    path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    gitBlobSha1: gitBlob(bytes),
  };
  known.set(path, entry);
  manifest.files.push(entry);
}
async function pool(items, size, work) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length) await work(queue.shift());
    }),
  );
}

const chapters = registry.units.filter(
  (unit) =>
    unit.category === 'archon-quest' &&
    !exclude.has(unit.providerRef.chapterId) &&
    (!onlySet || onlySet.has(unit.providerRef.chapterId)),
);
const quests = [
  ...new Set(chapters.flatMap((unit) => unit.providerRef.mainQuestIds)),
].sort((a, b) => a - b);
let talks = 0;
const withTalks = [];
await pool(quests, 12, async (id) => {
  const bytes = await obtain(`BinOutput/Quest/${id}.json`);
  if (!bytes) {
    gaps.push({ quest: id, reason: 'archivo de misión inexistente' });
    return;
  }
  const quest = JSON.parse(bytes.toString('utf8'));
  if (!quest.DLLABGGCEBM?.length) {
    gaps.push({
      quest: id,
      reason: 'el archivo de misión no enumera diálogos',
    });
    return;
  }
  withTalks.push(id);
  for (const talk of quest.DLLABGGCEBM ?? []) {
    talks++;
    if (!(await obtain(`BinOutput/Talk/Quest/${talk.id}.json`)))
      gaps.push({ quest: id, talk: talk.id, reason: 'diálogo inexistente' });
  }
});
manifest.files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
manifest.acquisition.fileCount = manifest.files.length;
manifest.acquisition.bytes = manifest.files.reduce((n, f) => n + f.bytes, 0);
manifest.acquisition.extension3 = `05/10/2026 (N-11/N-12): misiones y diálogos de ${chapters.length} capítulos de Misión de Arconte (${quests.length} misiones principales); huellas calculadas al descargar desde la URL fijada al commit, sin inventario Git independiente.`;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const unselectable = new Set(
  gaps.filter((gap) => !gap.talk).map((gap) => gap.quest),
);
selection.quests = [...new Set([...selection.quests, ...withTalks])]
  .filter((id) => !unselectable.has(id))
  .sort((a, b) => a - b);
writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n');
writeFileSync(
  '.validation/p1/arc-gaps.json',
  JSON.stringify(gaps, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    chapters: chapters.length,
    quests: withTalks.length,
    talks,
    gaps: gaps.length,
  }),
);
