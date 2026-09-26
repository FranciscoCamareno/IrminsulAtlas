// P1 research probe. It never writes application content or promotes a snapshot.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

const { fetch, AbortSignal } = globalThis;
const root = process.cwd();
const manifest = JSON.parse(
  readFileSync('docs/validation/p1/snapshot-manifest.json', 'utf8'),
);
const cache = resolve(root, '.validation/p1/raw');
const output = resolve(root, '.validation/p1');
const download = process.argv.includes('--download');
const hash = (value) => createHash('sha256').update(value).digest('hex');
assert.match(manifest.commit, /^[a-f0-9]{40}$/);
assert.equal(
  manifest.repository,
  'https://github.com/DimbreathBot/AnimeGameData',
);

function localPath(path) {
  const target = resolve(cache, path);
  assert.ok(target.startsWith(cache + sep), 'File must remain in the P1 cache');
  return target;
}

// The explicit manifest bounds acquisition. No branch lookup, full clone or silent fallback.
for (const file of manifest.files) {
  const target = localPath(file.path);
  if (!existsSync(target)) {
    assert.ok(
      download,
      `Missing ${file.path}; rerun with --download to acquire the pinned sample`,
    );
    const url = `https://raw.githubusercontent.com/DimbreathBot/AnimeGameData/${manifest.commit}/${file.path}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `${file.path}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, file.bytes, `Size mismatch: ${file.path}`);
    assert.equal(hash(bytes), file.sha256, `Hash mismatch: ${file.path}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  const bytes = readFileSync(target);
  assert.equal(bytes.length, file.bytes, `Size mismatch: ${file.path}`);
  assert.equal(hash(bytes), file.sha256, `Hash mismatch: ${file.path}`);
  const gitBlob = createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
  assert.equal(gitBlob, file.gitBlobSha1, `Git blob mismatch: ${file.path}`);
}
const json = (path) => JSON.parse(readFileSync(localPath(path), 'utf8'));
const table = (name) => json(`ExcelBinOutput/${name}ExcelConfigData.json`);
const main = json('TextMap/TextMapES.json');
const medium = json('TextMap/TextMap_MediumES.json');
const overlap = Object.keys(main).filter((key) => Object.hasOwn(medium, key));
const conflicts = overlap.filter((key) => main[key] !== medium[key]);
assert.equal(
  conflicts.length,
  0,
  'Resolve TextMap conflicts explicitly; do not overwrite',
);

function text(hashId) {
  if (hashId === undefined || hashId === 0)
    return { status: 'no-hash', hashId: hashId ?? null };
  assert.ok(
    Number.isSafeInteger(hashId),
    'Only verified safe integer text fields are resolved',
  );
  const from = Object.hasOwn(main, hashId)
    ? 'TextMapES'
    : Object.hasOwn(medium, hashId)
      ? 'TextMap_MediumES'
      : null;
  if (!from) return { status: 'missing', hashId };
  const value = (from === 'TextMapES' ? main : medium)[hashId];
  assert.equal(typeof value, 'string');
  return {
    status: value.length ? 'available' : 'empty',
    hashId,
    from,
    characters: value.length,
    sha256: hash(value),
  };
}
const value = (id) => main[id] ?? medium[id] ?? null;
const npcs = new Map(table('Npc').map((npc) => [String(npc.id), npc]));
const review = [];

function conversation(path, rootId) {
  const raw = json(path);
  const coop = Array.isArray(raw.PFALHAKIILD);
  const records = coop ? raw.PFALHAKIILD : raw.PCIAMAFDDAA;
  assert.ok(Array.isArray(records), `Unknown conversation shape: ${path}`);
  const segments = records.map((record, index) => {
    const id = coop ? record.OIFGMOHKPOI : record.id;
    const textHash = coop ? record.OACNIBLFFDI : record.LKECPJIFFEE;
    const role = coop ? record.LFGCLNLPAPB : record.KBPOBGFGLKN;
    const roleId = coop ? role?._id : role?.id;
    const roleType = coop ? role?._type : role?.type;
    const next = (coop ? record.KMLAFCBMFEI : record.GLJCECCOEDP) ?? [];
    const speaker = roleType === 'TALK_ROLE_NPC' ? npcs.get(roleId) : null;
    const resolution = text(textHash);
    const pointer = `/${coop ? 'PFALHAKIILD' : 'PCIAMAFDDAA'}/${index}`;
    review.push({
      locator: `${path}#${pointer}`,
      id,
      speaker: speaker ? value(speaker.nameTextMapHash) : roleType,
      next,
      resolution: resolution.status,
      text: value(textHash),
    });
    return {
      id,
      pointer,
      text: resolution,
      role: {
        id: roleId ?? null,
        type: roleType ?? null,
        name: speaker ? value(speaker.nameTextMapHash) : null,
      },
      next,
    };
  });
  const ids = new Set(segments.map((segment) => segment.id));
  assert.equal(ids.size, segments.length, `Repeated ID inside ${path}`);
  const reachable = new Set();
  const visit = (id) => {
    if (id === 0 || reachable.has(id)) return;
    reachable.add(id);
    for (const next of segments.find((segment) => segment.id === id)?.next ??
      [])
      visit(next);
  };
  if (rootId !== undefined) visit(rootId);
  return {
    path,
    shape: coop ? 'coop' : 'talk',
    rootId: rootId ?? null,
    // Array order alone does not prove a conversation entry point.
    rootVerified: rootId !== undefined && ids.has(rootId),
    records: segments.length,
    resolved: segments.filter((segment) => segment.text.status === 'available')
      .length,
    medium: segments.filter(
      (segment) => segment.text.from === 'TextMap_MediumES',
    ).length,
    branches: segments
      .filter((segment) => segment.next.length > 1)
      .map(({ id, next }) => ({ id, next })),
    externalTargets: segments.flatMap((segment) =>
      segment.next
        .filter((id) => id !== 0 && !ids.has(id))
        .map((target) => ({ from: segment.id, to: target })),
    ),
    unresolved: segments
      .filter((segment) => segment.text.status !== 'available')
      .map((segment) => ({
        id: segment.id,
        ...segment.text,
        reachable: rootId === undefined ? null : reachable.has(segment.id),
      })),
    segments,
  };
}

const questCases = [
  ['archon', 352],
  ['world', 10007],
  ['story', 451],
  ['old-event', 41111],
  ['recent-event', 40250],
  ['hangout-entry', 19001],
].map(([category, id]) => {
  const path = `BinOutput/Quest/${id}.json`;
  const raw = json(path);
  const metadata = table('MainQuest').find((quest) => quest.id === id);
  assert.ok(metadata);
  const conversations = raw.DLLABGGCEBM.map((talk) =>
    conversation(`BinOutput/Talk/Quest/${talk.id}.json`, talk.NNEHBCLEGHG),
  );
  return {
    category,
    id,
    title: value(metadata.titleTextMapHash),
    path,
    chapterId: metadata.chapterId ?? null,
    type: metadata.type ?? null,
    activityId: raw.activityId ?? null,
    conversationCount: conversations.length,
    records: conversations.reduce((sum, talk) => sum + talk.records, 0),
    resolved: conversations.reduce((sum, talk) => sum + talk.resolved, 0),
    conversations,
  };
});
const npcGroup = json('BinOutput/Talk/NpcGroup/1465.json');
const ambient = npcGroup.DLLABGGCEBM.map((talk) =>
  conversation(`BinOutput/Talk/Npc/${talk.id}.json`, talk.NNEHBCLEGHG),
);
const coop = ['1900102_7', '1900102_10'].map((name) =>
  conversation(`BinOutput/Talk/Coop/${name}.json`),
);
const points = table('CoopPoint')
  .filter((point) => point.chapterId === 101401)
  .map((point) => ({
    id: point.id,
    type: point.type,
    acceptQuest: point.acceptQuest ?? null,
    next: point.postPointList ?? [],
  }));
assert.ok(
  points.every((point) =>
    point.next.every((id) => points.some((target) => target.id === id)),
  ),
);

const documents = table('Document');
const localization = table('Localization');
const books = table('BooksCodex')
  .filter((book) => book.id >= 50005001 && book.id <= 50005007)
  .sort((a, b) => a.sortOrder - b.sortOrder);
assert.equal(books.length, 7);
const artifact = table('ReliquaryCodex').find((set) => set.id === 30107504);
assert.ok(artifact);
const pieces = ['cupId', 'leatherId', 'capId', 'flowerId', 'sandId'].map(
  (field) => table('Reliquary').find((piece) => piece.id === artifact[field]),
);
assert.ok(pieces.every((piece) => piece?.setId === 15001));
const weapon = table('Weapon').find((item) => item.id === 11501);
assert.ok(weapon);
const documentCases = [
  ...books.map((book) => ({
    category: 'book',
    id: book.materialId,
    codexId: book.id,
  })),
  { category: 'letter', id: 100214 },
  { category: 'weapon', id: weapon.storyId, itemId: weapon.id },
  ...pieces.map((piece) => ({
    category: 'artifact',
    id: piece.storyId,
    itemId: piece.id,
  })),
].map((item) => {
  const document = documents.find((entry) => entry.id === item.id);
  assert.ok(document);
  const files = document.questIDList.map((id) => {
    const localized = localization.find((entry) => entry.id === id);
    assert.ok(localized?.esPath?.startsWith('ART/UI/Readable/ES/'));
    const path = localized.esPath.replace('ART/UI/', '') + '.txt';
    const original = readFileSync(localPath(path), 'utf8');
    assert.ok(original.length);
    review.push({ locator: path, id: item.id, text: original });
    return {
      localizationId: id,
      path,
      characters: original.length,
      sha256: hash(Buffer.from(original)),
      lineCount: original.split(/\r?\n/).length,
    };
  });
  return { ...item, title: value(document.titleTextMapHash), files };
});
const story = table('FetterStory').find((entry) => entry.fetterId === 10202);
assert.equal(story.avatarId, 10000021);
const avatar = table('Avatar').find((entry) => entry.id === story.avatarId);
assert.ok(avatar);
review.push({
  locator:
    'ExcelBinOutput/FetterStoryExcelConfigData.json#fetterId=10202/storyContextTextMapHash',
  id: story.fetterId,
  text: value(story.storyContextTextMapHash),
});
const codex = json('BinOutput/CodexQuest/1000.json');
const codexTexts = [];
function inspectCodex(item, pointer = '') {
  if (!item || typeof item !== 'object') return;
  if (Object.hasOwn(item, 'textId'))
    codexTexts.push({
      pointer,
      kind: item.DFKLAEHPOBE ?? null,
      ...text(item.textId),
    });
  for (const [key, child] of Object.entries(item))
    inspectCodex(child, `${pointer}/${key}`);
}
inspectCodex(codex);
const result = {
  probeVersion: 1,
  commit: manifest.commit,
  humanReview: 'pending',
  filesVerified: manifest.files.length,
  bytesVerified: manifest.files.reduce((sum, file) => sum + file.bytes, 0),
  textMaps: {
    main: Object.keys(main).length,
    medium: Object.keys(medium).length,
    overlap: overlap.length,
    conflicts: conflicts.length,
  },
  quests: questCases,
  ambient: {
    npcId: 1465,
    name: value(npcs.get('1465').nameTextMapHash),
    conversations: ambient,
  },
  hangout: {
    chapterId: 101401,
    points,
    selectedConversations: coop,
    completeChapterDialogueReviewed: false,
  },
  documents: documentCases,
  character: {
    avatarId: story.avatarId,
    name: value(avatar.nameTextMapHash),
    fetterId: story.fetterId,
    title: value(story.storyTitleTextMapHash),
    text: text(story.storyContextTextMapHash),
    conditionsPreserved: { open: story.openConds, finish: story.finishConds },
  },
  codexProbe: { path: 'BinOutput/CodexQuest/1000.json', texts: codexTexts },
};
mkdirSync(output, { recursive: true });
writeFileSync(
  resolve(output, 'results.json'),
  JSON.stringify(result, null, 2) + '\n',
);
if (process.argv.includes('--check')) {
  assert.deepEqual(
    result,
    JSON.parse(readFileSync('docs/validation/p1/muestra-fuentes.json', 'utf8')),
    'P1 evidence differs from the committed sample',
  );
}
const escape = (input) =>
  String(input ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const cards = review
  .map(
    (entry) =>
      `<section><h2>${escape(entry.locator)}</h2><p>ID: ${escape(entry.id)} · Hablante: ${escape(entry.speaker)} · Siguientes: ${escape(JSON.stringify(entry.next ?? []))}</p><pre>${escape(entry.text ?? '[Texto ausente en ambos TextMap ES]')}</pre></section>`,
  )
  .join('\n');
writeFileSync(
  resolve(output, 'revision-humana.html'),
  `<!doctype html><html lang="es"><meta charset="utf-8"><title>P1 — Revisión pendiente</title><style>body{max-width:80ch;margin:2rem auto;padding:1rem;font:16px/1.6 system-ui}section{border-top:1px solid #888;margin-top:2rem}h2{font:14px monospace;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style><h1>Muestra P1 · revisión humana pendiente</h1><p>Material original con spoilers. No constituye contenido editorial aprobado. Verificar hablantes, límites, ramas y localizadores con el registro de revisión; la sonda no marca aprobaciones.</p>${cards}</html>`,
);
console.log(
  JSON.stringify(
    {
      filesVerified: result.filesVerified,
      bytesVerified: result.bytesVerified,
      textMaps: result.textMaps,
      quests: questCases.map(
        ({ id, conversationCount, records, resolved }) => ({
          id,
          conversationCount,
          records,
          resolved,
        }),
      ),
      ambient: ambient.reduce((sum, talk) => sum + talk.records, 0),
      hangoutPoints: points.length,
      hangoutEnds: points.filter((point) => point.type === 'POINT_END').length,
      documentFiles: documentCases.flatMap((item) => item.files).length,
      codexTexts: codexTexts.length,
      unresolvedCodex: codexTexts.filter((item) => item.status !== 'available')
        .length,
    },
    null,
    2,
  ),
);
