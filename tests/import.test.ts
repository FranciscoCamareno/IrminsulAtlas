import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  writeFile,
  rm,
  unlink,
} from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import {
  ImportSelectionSchema,
  SnapshotManifestSchema,
  type ImportSelection,
  type SnapshotManifest,
} from '../src/domain/schema.ts';
import { normalizeSnapshot } from '../scripts/import/adapter.ts';
import { acquireSnapshot, readSnapshot } from '../scripts/import/acquire.ts';
import {
  acceptedSubset,
  compareImports,
  importSnapshot,
  promoteCandidate,
  readAccepted,
  readCandidate,
  validateCandidate,
  writeFailure,
} from '../scripts/import/pipeline.ts';
import {
  ADAPTER,
  ImportFailure,
  SNAPSHOT,
  exactJson,
  gitBlob,
  sha256,
  stableJson,
} from '../scripts/import/shared.ts';

const fixtureRoot = resolve('tests/fixtures/import/raw');
const temporaryRoot = resolve('.validation/p2/tests');
const created: string[] = [];
const selection = (): ImportSelection =>
  ImportSelectionSchema.parse({
    schemaVersion: 1,
    adapterVersion: ADAPTER,
    quests: [9001],
    ambientNpcs: [],
    hangouts: [],
    documents: [{ id: 9002, kind: 'letter' }],
    characterStories: [9005],
    exclusions: [],
  });
async function fixture() {
  await mkdir(temporaryRoot, { recursive: true });
  const dir = await mkdtemp(resolve(temporaryRoot, 'case-'));
  created.push(dir);
  const cache = resolve(dir, 'raw');
  const files = new Map<string, Buffer>();
  for (const file of await readdir(fixtureRoot, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!file.isFile()) continue;
    const absolute = resolve(file.parentPath, file.name);
    const path = absolute
      .slice(fixtureRoot.length + 1)
      .split(sep)
      .join('/');
    files.set(path, await readFile(absolute));
  }
  const options = {
    manifest: {} as SnapshotManifest,
    selection: selection(),
    cache,
    candidates: resolve(dir, 'candidates'),
    store: resolve(dir, 'accepted'),
  };
  async function save() {
    for (const [path, bytes] of files) {
      const target = resolve(cache, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    options.manifest = SnapshotManifestSchema.parse({
      manifestVersion: 1,
      repository: 'https://github.com/DimbreathBot/AnimeGameData',
      commit: '0'.repeat(40),
      language: 'ES',
      contentOrigin: 'synthetic',
      files: [...files]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, bytes]) => ({
          path,
          bytes: bytes.length,
          sha256: sha256(bytes),
          gitBlobSha1: gitBlob(bytes),
        })),
    });
  }
  function edit(path: string, update: (json: Record<string, unknown>) => void) {
    const data = exactJson(files.get(path)!.toString(), path) as Record<
      string,
      unknown
    >;
    update(data);
    files.set(path, Buffer.from(stableJson(data)));
  }
  await save();
  return { options, files, save, edit, dir };
}
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const path of created.splice(0)) {
    // Only remove directories created by this test run, beneath its dedicated root.
    if (!resolve(path).startsWith(temporaryRoot + sep))
      throw new Error('Unsafe test cleanup');
    await rm(path, { recursive: true, force: true });
  }
});

describe('P2 normalization and provenance', () => {
  it('preserves Medium, choices, original text, opaque integers and multiple document fragments', async () => {
    const { options, files } = await fixture();
    const dataset = normalizeSnapshot(
      options.manifest,
      options.selection,
      files,
    );
    const mission = dataset.sources.find(
      (source) => source.kind === 'mission',
    )!;
    expect(mission.segments[0]!.nextSegmentIds).toEqual([
      'agd-quest-9001-es-talk-90011-dialog-9001102',
      'agd-quest-9001-es-talk-90011-dialog-9001103',
    ]);
    expect(mission.segments[1]!.text).toMatchObject({
      status: 'available',
      value: '[DEMO] Solo Medium',
      origin: { path: 'TextMap/TextMap_MediumES.json', pointer: '/4' },
    });
    expect(mission.segments[1]!.endsConversation).toBe(true);
    expect(mission.segments[2]!.speaker).toEqual({
      externalId: null,
      roleType: null,
      name: null,
    });
    expect(mission.context).toMatchObject({
      quest: {
        opaque: '18446744073709551615',
        DLLABGGCEBM: [
          { JEDNDGCOMGC: [{ type: 'DEMO_CONDITION', param: ['9', '2'] }] },
        ],
      },
    });
    const letter = dataset.sources.find((source) => source.kind === 'letter')!;
    expect(letter.segments).toHaveLength(2);
    expect(letter.segments[1]!.text).toMatchObject({
      status: 'available',
      value: '[DEMO] <script>neverExecute()</script> & texto.\n',
    });
    expect(
      dataset.sources.every(
        (source) =>
          source.editorialStatus === 'draft' &&
          source.publication === 'not-publishable',
      ),
    ).toBe(true);
    expect(dataset).not.toHaveProperty('events');
  });

  it('keeps Coop branches/conditions but excludes variants without verified roots', async () => {
    const { options } = await fixture();
    options.selection.hangouts = [
      {
        chapterId: 9003,
        conversationFiles: ['BinOutput/Talk/Coop/90002_1.json'],
      },
    ];
    options.selection.exclusions = [
      { sourceId: 'agd-coop-9003-es', reason: 'DEMO: partial routes' },
    ];
    const result = await importSnapshot(options);
    const candidate = await readCandidate(options.candidates, result.id);
    const coop = candidate.dataset.sources.find(
      (source) => source.kind === 'hangout',
    )!;
    expect(coop.context).toMatchObject({
      points: [
        { id: 9100, postPointList: [9101, 9102] },
        { id: 9101 },
        { id: 9102 },
      ],
    });
    expect(coop.segments[0]!.nextSegmentIds).toEqual([
      'agd-coop-9003-es-talk-90002-1-dialog-9202',
    ]);
    expect(result.report.issues.map((issue) => issue.code)).toContain(
      'UNKNOWN_ROOT',
    );
    expect(
      acceptedSubset(candidate).sources.map((source) => source.id),
    ).not.toContain(coop.id);
  });

  it('produces byte-identical candidates offline and does not promote implicitly', async () => {
    const { options } = await fixture();
    const network = vi.fn(() => {
      throw new Error('Network forbidden');
    });
    vi.stubGlobal('fetch', network);
    const first = await importSnapshot(options);
    const bytes = await readFile(
      resolve(options.candidates, first.id, 'candidate.json'),
    );
    const second = await importSnapshot(options);
    expect(second.id).toBe(first.id);
    expect(
      await readFile(resolve(options.candidates, second.id, 'candidate.json')),
    ).toEqual(bytes);
    expect(first.report).toEqual(second.report);
    expect(await readAccepted(options.store)).toBeNull();
    expect(network).not.toHaveBeenCalled();
  });

  it('keeps segment identity independent of array order, titles and snapshot version', async () => {
    const { options, files, edit } = await fixture();
    const first = normalizeSnapshot(options.manifest, options.selection, files);
    edit('BinOutput/Talk/Quest/90011.json', (row) =>
      (row.PCIAMAFDDAA as unknown[]).reverse(),
    );
    edit('TextMap/TextMapES.json', (row) => {
      row['1'] = '[DEMO] Different title';
    });
    options.manifest.commit = '1'.repeat(40);
    const second = normalizeSnapshot(
      options.manifest,
      options.selection,
      files,
    );
    expect(second.sources.map((source) => source.id)).toEqual(
      first.sources.map((source) => source.id),
    );
    const ids = (data: typeof first) =>
      data.sources
        .flatMap((source) => source.segments.map((segment) => segment.id))
        .sort();
    expect(ids(second)).toEqual(ids(first));
  });

  it('rejects a conflicting translation instead of overwriting; equal duplicates are allowed', async () => {
    const { options, files, edit } = await fixture();
    edit('TextMap/TextMap_MediumES.json', (row) => {
      row['3'] = 'Conflict';
    });
    expect(() =>
      normalizeSnapshot(options.manifest, options.selection, files),
    ).toThrow(/TEXTMAP_CONFLICT.*\/3/);
    edit('TextMap/TextMap_MediumES.json', (row) => {
      row['3'] = '[DEMO] Inicio';
    });
    expect(() =>
      normalizeSnapshot(options.manifest, options.selection, files),
    ).not.toThrow();
  });
});

describe('P2 variant identities', () => {
  it('keeps repeated dialog IDs in different files as separate variants', async () => {
    const { options, files, edit, save } = await fixture();
    const copy = JSON.parse(
      files.get('BinOutput/Talk/Quest/90011.json')!.toString(),
    ) as Record<string, unknown>;
    copy.talkId = 90012;
    files.set('BinOutput/Talk/Quest/90012.json', Buffer.from(stableJson(copy)));
    edit('BinOutput/Quest/9001.json', (row) => {
      (row.DLLABGGCEBM as unknown[]).push({ id: 90012, NNEHBCLEGHG: 9001101 });
    });
    await save();
    const result = await importSnapshot(options);
    const candidate = await readCandidate(options.candidates, result.id);
    const mission = candidate.dataset.sources.find(
      (source) => source.kind === 'mission',
    )!;
    expect(mission.segments).toHaveLength(6);
    expect(new Set(mission.segments.map((segment) => segment.id)).size).toBe(6);
    expect(
      mission.conversations.map((conversation) => conversation.rootSegmentId),
    ).toEqual([
      'agd-quest-9001-es-talk-90011-dialog-9001101',
      'agd-quest-9001-es-talk-90012-dialog-9001101',
    ]);
  });
});

describe('P2 rejected input preserves accepted versions', () => {
  it.each([
    'missing-file',
    'checksum',
    'corrupt-json',
    'changed-field',
    'missing-translation',
    'duplicate-id',
    'dangling-branch',
    'dangling-root',
    'unknown-format',
  ])('%s never replaces the accepted pointer or data', async (fault) => {
    const f = await fixture();
    const good = await importSnapshot(f.options);
    const pointer = await promoteCandidate(
      f.options.candidates,
      good.id,
      f.options.store,
    );
    const pointerPath = resolve(f.options.store, 'accepted.json');
    const acceptedPath = resolve(
      f.options.store,
      'versions',
      pointer.version,
      'sources.json',
    );
    const beforePointer = await readFile(pointerPath);
    const beforeData = await readFile(acceptedPath);
    const talk = 'BinOutput/Talk/Quest/90011.json';
    if (fault === 'corrupt-json') f.files.set(talk, Buffer.from('{broken'));
    if (fault === 'changed-field')
      f.edit(talk, (row) => {
        row.OTHER_FIELD = row.PCIAMAFDDAA;
        delete row.PCIAMAFDDAA;
      });
    if (fault === 'missing-translation')
      f.edit('TextMap/TextMap_MediumES.json', (row) => {
        delete row['4'];
      });
    if (fault === 'duplicate-id')
      f.edit(talk, (row) => {
        const a = row.PCIAMAFDDAA as unknown[];
        a.push(a[0]);
      });
    if (fault === 'dangling-branch')
      f.edit(talk, (row) => {
        (row.PCIAMAFDDAA as Record<string, unknown>[])[0]!.GLJCECCOEDP = [
          999999,
        ];
      });
    if (fault === 'dangling-root')
      f.edit('BinOutput/Quest/9001.json', (row) => {
        (row.DLLABGGCEBM as Record<string, unknown>[])[0]!.NNEHBCLEGHG = 999999;
      });
    await f.save();
    if (fault === 'missing-file') await unlink(resolve(f.options.cache, talk));
    if (fault === 'checksum')
      await writeFile(resolve(f.options.cache, talk), '{}');
    if (fault === 'unknown-format') {
      f.options.manifest.contentOrigin = 'provider';
      f.options.manifest.commit = 'f'.repeat(40);
    }
    let rejected = false;
    try {
      const bad = await importSnapshot(f.options);
      expect(bad.report.status).toBe('rejected');
      await promoteCandidate(f.options.candidates, bad.id, f.options.store);
    } catch (error) {
      expect(error).toBeInstanceOf(ImportFailure);
      rejected = true;
    }
    expect(rejected).toBe(true);
    expect(await readFile(pointerPath)).toEqual(beforePointer);
    expect(await readFile(acceptedPath)).toEqual(beforeData);
  });

  it('accepts a quest with declared gaps only when recordGaps is on, and reads it back', async () => {
    const { options, edit, save } = await fixture();
    edit('BinOutput/Talk/Quest/90011.json', (row) => {
      (row.PCIAMAFDDAA as Record<string, unknown>[])[0]!.GLJCECCOEDP = [999999];
    });
    await save();
    options.selection.recordGaps = true;
    const candidate = await importSnapshot(options);
    expect(candidate.report.status).toBe('valid');
    const source = (
      await readCandidate(options.candidates, candidate.id)
    ).dataset.sources.find((item) => item.id === 'agd-quest-9001-es')!;
    expect(source.incomplete).toEqual(['1 enlaces a diálogos inexistentes']);
    await promoteCandidate(options.candidates, candidate.id, options.store);
    // The declared gap is a warning: the accepted version stays readable.
    const accepted = await readAccepted(options.store);
    expect(
      accepted!.dataset.sources.some((item) => item.id === source.id),
    ).toBe(true);
  });

  it('reports explicit missing-text exclusions and promotes only complete sources', async () => {
    const { options, edit, save } = await fixture();
    edit('TextMap/TextMap_MediumES.json', (row) => {
      delete row['4'];
    });
    await save();
    options.selection.exclusions = [
      { sourceId: 'agd-quest-9001-es', reason: 'DEMO: unresolved translation' },
    ];
    const candidate = await importSnapshot(options);
    expect(candidate.report).toMatchObject({
      status: 'valid',
      sourcesExcluded: 1,
      unresolvedTexts: 1,
    });
    expect(candidate.report.issues).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_TEXT',
        id: '9001102',
        severity: 'warning',
        file: 'BinOutput/Talk/Quest/90011.json',
      }),
    );
    await promoteCandidate(options.candidates, candidate.id, options.store);
    const current = await readAccepted(options.store);
    expect(current!.dataset.sources).toHaveLength(2);
    expect(
      current!.dataset.sources
        .flatMap((source) => source.segments)
        .every((segment) => segment.text.status === 'available'),
    ).toBe(true);
  });

  it('detects edited candidates and text checksums before promotion', async () => {
    const { options } = await fixture();
    const result = await importSnapshot(options);
    const candidate = await readCandidate(options.candidates, result.id);
    const segment = candidate.dataset.sources[0]!.segments[0]!;
    if (segment.text.status !== 'available')
      throw new Error('Expected available fixture');
    segment.text.value += ' changed';
    expect(validateCandidate(candidate).map((issue) => issue.code)).toContain(
      'TEXT_CHECKSUM',
    );
    await writeFile(
      resolve(options.candidates, result.id, 'candidate.json'),
      stableJson(candidate),
    );
    await expect(
      promoteCandidate(options.candidates, result.id, options.store),
    ).rejects.toThrow('CHECKSUM_MISMATCH');
    expect(await readAccepted(options.store)).toBeNull();
  });

  it('compares added/changed/removed sources and keeps the previous immutable version', async () => {
    const { options, edit, save } = await fixture();
    const first = await importSnapshot(options);
    const initial = await promoteCandidate(
      options.candidates,
      first.id,
      options.store,
    );
    edit('TextMap/TextMap_MediumES.json', (row) => {
      row['4'] = '[DEMO] Changed segment';
    });
    await save();
    options.selection.characterStories = [];
    const second = await importSnapshot(options);
    expect(second.diff.changed).toContain('agd-quest-9001-es');
    expect(second.diff.removed).toEqual(['agd-fetter-9005-es']);
    expect(second.diff.unchanged).toContain('agd-document-9002-es');
    const accepted = await promoteCandidate(
      options.candidates,
      second.id,
      options.store,
    );
    expect(accepted.previousVersion).toBe(initial.version);
    expect(
      await readFile(
        resolve(options.store, 'versions', initial.version, 'sources.json'),
        'utf8',
      ),
    ).toContain('[DEMO] Solo Medium');
    expect(
      await promoteCandidate(options.candidates, second.id, options.store),
    ).toEqual(accepted);
    const current = await readAccepted(options.store);
    expect(compareImports(current!.dataset, current!.dataset).changed).toEqual(
      [],
    );
  });

  it('recovers a previous accepted version by restoring its pointer, reproducing its dataset', async () => {
    const { options, edit, save } = await fixture();
    const first = await importSnapshot(options);
    const initial = await promoteCandidate(
      options.candidates,
      first.id,
      options.store,
    );
    const before = (await readAccepted(options.store))!.dataset;
    edit('TextMap/TextMap_MediumES.json', (row) => {
      row['4'] = '[DEMO] Changed segment';
    });
    await save();
    const second = await importSnapshot(options);
    const accepted = await promoteCandidate(
      options.candidates,
      second.id,
      options.store,
    );
    expect((await readAccepted(options.store))!.dataset).not.toEqual(before);
    // Recovery procedure: the immutable version stays on disk, so the pointer
    // returns to it (there is no rollback command).
    await writeFile(
      resolve(options.store, 'accepted.json'),
      stableJson({
        schemaVersion: 1,
        version: initial.version,
        previousVersion: initial.previousVersion,
      }),
    );
    const recovered = await readAccepted(options.store);
    expect(recovered!.pointer.version).toBe(initial.version);
    expect(recovered!.dataset).toEqual(before);
    expect(accepted.previousVersion).toBe(initial.version);
  });

  it('keeps the previous pointer if the target version cannot be written; rejects a concurrent promotion', async () => {
    const { options, edit, save } = await fixture();
    const first = await importSnapshot(options);
    await promoteCandidate(options.candidates, first.id, options.store);
    const before = await readFile(resolve(options.store, 'accepted.json'));
    edit('TextMap/TextMapES.json', (row) => {
      row['3'] = '[DEMO] New';
    });
    await save();
    const second = await importSnapshot(options);
    const candidate = await readCandidate(options.candidates, second.id);
    const version = sha256(stableJson(acceptedSubset(candidate)));
    await writeFile(
      resolve(options.store, 'versions', version),
      'DEMO: blocked directory',
    );
    await expect(
      promoteCandidate(options.candidates, second.id, options.store),
    ).rejects.toThrow();
    expect(await readFile(resolve(options.store, 'accepted.json'))).toEqual(
      before,
    );
    await writeFile(resolve(options.store, 'promotion.lock'), 'DEMO');
    await expect(
      promoteCandidate(options.candidates, second.id, options.store),
    ).rejects.toThrow('PROMOTION_LOCKED');
    expect(await readFile(resolve(options.store, 'accepted.json'))).toEqual(
      before,
    );
  });
});

describe('P2 acquisition boundary and failure reports', () => {
  it('uses pinned URLs, verifies before writing and never invokes normalization', async () => {
    const { options, files, dir } = await fixture();
    options.manifest.contentOrigin = 'provider';
    options.manifest.commit = SNAPSHOT;
    options.manifest.files = options.manifest.files.filter(
      (file) => file.path === 'TextMap/TextMapES.json',
    );
    const path = options.manifest.files[0]!.path;
    const request = vi.fn<typeof fetch>(
      async () => new Response(files.get(path)!.toString()),
    );
    const destination = resolve(dir, 'download');
    await acquireSnapshot(options.manifest, destination, request);
    expect(request.mock.calls[0]![0]).toContain(`/${SNAPSHOT}/${path}`);
    expect(await readFile(resolve(destination, path))).toEqual(files.get(path));
    await acquireSnapshot(options.manifest, destination, request);
    expect(request).toHaveBeenCalledTimes(1);
    expect(await readAccepted(options.store)).toBeNull();
  });

  it.each(['interrupted', 'http-error', 'bad-checksum'])(
    'rejects %s downloads without replacing an accepted version',
    async (mode) => {
      const { options, dir } = await fixture();
      const good = await importSnapshot(options);
      await promoteCandidate(options.candidates, good.id, options.store);
      const before = await readFile(resolve(options.store, 'accepted.json'));
      options.manifest.contentOrigin = 'provider';
      options.manifest.files = options.manifest.files.slice(0, 1);
      const request = vi.fn(async () => {
        if (mode === 'interrupted') throw new Error('Network lost');
        return new Response('invalid bytes', {
          status: mode === 'http-error' ? 503 : 200,
        });
      });
      await expect(
        acquireSnapshot(options.manifest, resolve(dir, 'download'), request),
      ).rejects.toThrow();
      expect(await readFile(resolve(options.store, 'accepted.json'))).toEqual(
        before,
      );
      await expect(
        readFile(resolve(dir, 'download', options.manifest.files[0]!.path)),
      ).rejects.toThrow();
    },
  );

  it('rejects unsafe and duplicate manifest paths and reports JSON errors with provenance', async () => {
    const { options, dir } = await fixture();
    expect(
      SnapshotManifestSchema.safeParse({
        ...options.manifest,
        files: [{ ...options.manifest.files[0], path: '../outside.json' }],
      }).success,
    ).toBe(false);
    expect(
      SnapshotManifestSchema.safeParse({
        ...options.manifest,
        files: [options.manifest.files[0], options.manifest.files[0]],
      }).success,
    ).toBe(false);
    try {
      exactJson('{broken', 'demo/broken.json');
    } catch (error) {
      const path = await writeFailure(resolve(dir, 'reports'), error);
      const report = JSON.parse(await readFile(path, 'utf8')) as {
        status: string;
        issues: unknown[];
      };
      expect(report.status).toBe('rejected');
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_JSON',
          file: 'demo/broken.json',
        }),
      );
    }
    expect(await readSnapshot(options.manifest, options.cache)).toHaveProperty(
      'size',
      options.manifest.files.length,
    );
  });
});
