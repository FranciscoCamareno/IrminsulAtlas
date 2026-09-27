import { z } from 'zod';
import {
  ImportedDatasetSchema,
  type ImportedDataset,
  type ImportedText,
  type ImportSelection,
  type SnapshotManifest,
  type SourceLocator,
  type SourceRecord,
  type SourceSegment,
} from '../../src/domain/schema.ts';
import {
  ADAPTER,
  SNAPSHOT,
  exactJson,
  fail,
  parse,
  sha256,
  stableJson,
} from './shared.ts';

type Raw = Record<string, unknown>;
const record = (input: unknown, file: string, field = ''): Raw => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    fail(
      'SCHEMA_CHANGED',
      file,
      field,
      null,
      'Se esperaba un objeto del formato verificado',
    );
  return input as Raw;
};
function number(input: unknown, file: string, field: string): number {
  if (typeof input !== 'number' || !Number.isSafeInteger(input) || input < 0)
    fail(
      'SCHEMA_CHANGED',
      file,
      field,
      null,
      'Se esperaba un ID/hash entero seguro',
    );
  return input;
}
function list(input: unknown, file: string, field: string): unknown[] {
  if (!Array.isArray(input))
    fail(
      'SCHEMA_CHANGED',
      file,
      field,
      null,
      'Lista requerida ausente o incompatible',
    );
  return input;
}

export function normalizeSnapshot(
  manifest: SnapshotManifest,
  selection: ImportSelection,
  bytes: ReadonlyMap<string, Uint8Array>,
): ImportedDataset {
  if (manifest.contentOrigin === 'provider' && manifest.commit !== SNAPSHOT)
    fail(
      'UNSUPPORTED_SNAPSHOT',
      'manifest',
      'commit',
      manifest.commit,
      'Revisar el mapeo antes de admitir otro snapshot',
    );
  const decoded = new Map<string, string>();
  const parsed = new Map<string, unknown>();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const file of manifest.files) {
    const content = bytes.get(file.path);
    if (!content)
      fail(
        'MISSING_FILE',
        file.path,
        '',
        null,
        'Archivo del manifiesto ausente',
      );
    let value: string;
    try {
      value = decoder.decode(content);
    } catch {
      fail('INVALID_ENCODING', file.path, '', null, 'UTF-8 inválido');
    }
    decoded.set(file.path, value);
    if (file.path.endsWith('.json'))
      parsed.set(file.path, exactJson(value, file.path));
  }
  const json = (file: string): unknown => {
    if (!parsed.has(file))
      fail(
        'MISSING_FILE',
        file,
        '',
        null,
        'Referencia no incluida en el manifiesto',
      );
    return parsed.get(file);
  };
  const tablePath = (name: string) =>
    `ExcelBinOutput/${name}ExcelConfigData.json`;
  const rows = (name: string) =>
    list(json(tablePath(name)), tablePath(name), '').map((row) =>
      record(row, tablePath(name)),
    );
  const lookup = (name: string, id: number, key = 'id') => {
    const matches = rows(name)
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row[key] === id);
    if (matches.length !== 1)
      fail(
        'INVALID_REFERENCE',
        tablePath(name),
        key,
        String(id),
        'La referencia debe resolver exactamente un registro',
      );
    return matches[0]!;
  };
  const origin = (path: string, pointer = ''): SourceLocator => {
    const file = manifest.files.find((file) => file.path === path);
    if (!file)
      fail(
        'MISSING_FILE',
        path,
        pointer,
        null,
        'Localizador fuera del manifiesto',
      );
    return { path, pointer, fileSha256: file.sha256 };
  };
  const rowOrigin = (name: string, index: number) =>
    origin(tablePath(name), `/${index}`);
  const mainPath = 'TextMap/TextMapES.json';
  const mediumPath = 'TextMap/TextMap_MediumES.json';
  const maps = [mainPath, mediumPath].map((path) =>
    parse(z.record(z.string(), z.string()), json(path), path),
  );
  const [main, medium] = maps as [
    Record<string, string>,
    Record<string, string>,
  ];
  for (const key of Object.keys(main)) {
    if (Object.hasOwn(medium, key) && main[key] !== medium[key])
      fail(
        'TEXTMAP_CONFLICT',
        mediumPath,
        `/${key}`,
        key,
        'Los diccionarios españoles contienen textos diferentes para el mismo hash',
        'translation',
      );
  }
  function resolveText(
    hash: unknown,
    file: string,
    field: string,
  ): ImportedText {
    const id = number(hash, file, field);
    const key = String(id);
    const path = Object.hasOwn(main, key)
      ? mainPath
      : Object.hasOwn(medium, key)
        ? mediumPath
        : null;
    const value =
      path === mainPath
        ? main[key]
        : path === mediumPath
          ? medium[key]
          : undefined;
    if (!path || !value?.length)
      return {
        status: 'missing',
        textMapHash: key,
        reason: 'Texto ausente o vacío en ambos diccionarios españoles',
      };
    return {
      status: 'available',
      value,
      sha256: sha256(value),
      textMapHash: key,
      origin: origin(path, `/${key}`),
    };
  }
  const title = (hash: unknown, path: string, field: string) => {
    const text = resolveText(hash, path, field);
    if (text.status !== 'available')
      fail(
        'MISSING_TEXT',
        path,
        field,
        String(hash),
        'Título sin traducción española',
        'translation',
      );
    return text.value;
  };
  const npcs =
    selection.quests.length ||
    selection.ambientNpcs.length ||
    selection.hangouts.length
      ? rows('Npc')
      : [];
  const sources: SourceRecord[] = [];
  const create = (
    id: string,
    externalId: number,
    kind: SourceRecord['kind'],
    name: string,
    locator: SourceLocator,
    context: unknown,
    metadataLocators: SourceLocator[] = [],
  ): SourceRecord => ({
    id,
    providerId: 'animegamedata',
    externalId: String(externalId),
    language: 'es',
    kind,
    title: name,
    locator,
    metadataLocators,
    editorialStatus: 'draft',
    publication: 'not-publishable',
    context: parse(z.json(), context, locator.path),
    conversations: [],
    segments: [],
  });

  function conversation(
    source: SourceRecord,
    path: string,
    root: number | null,
    variant: string,
    coop = false,
  ): void {
    const raw = record(json(path), path);
    const field = coop ? 'PFALHAKIILD' : 'PCIAMAFDDAA';
    const records = list(raw[field], path, field);
    if (!records.length)
      fail(
        'EMPTY_SOURCE',
        path,
        field,
        source.id,
        'Conversación sin segmentos',
      );
    const conversationId = `${source.id}-talk-${variant.replaceAll('_', '-')}`;
    const segmentId = (id: number) => `${conversationId}-dialog-${id}`;
    source.conversations.push({
      id: conversationId,
      locator: origin(path),
      rootSegmentId: root === null ? null : segmentId(root),
    });
    records.forEach((entry, index) => {
      const row = record(entry, path, `${field}/${index}`);
      const id = number(
        row[coop ? 'OIFGMOHKPOI' : 'id'],
        path,
        `${field}/${index}/id`,
      );
      const textField = coop ? 'OACNIBLFFDI' : 'LKECPJIFFEE';
      const nextField = coop ? 'KMLAFCBMFEI' : 'GLJCECCOEDP';
      const next = list(row[nextField] ?? [], path, nextField).map((id) =>
        number(id, path, nextField),
      );
      const role = row[coop ? 'LFGCLNLPAPB' : 'KBPOBGFGLKN'];
      const speaker =
        role === undefined ? {} : record(role, path, `${field}/${index}/role`);
      const roleId = speaker[coop ? '_id' : 'id'];
      const roleType = speaker[coop ? '_type' : 'type'];
      const npc =
        roleType === 'TALK_ROLE_NPC'
          ? npcs.find((npc) => String(npc.id) === String(roleId))
          : undefined;
      const speakerText = npc
        ? resolveText(npc.nameTextMapHash, tablePath('Npc'), 'nameTextMapHash')
        : null;
      source.segments.push({
        id: segmentId(id),
        externalId: String(id),
        locator: origin(path, `/${field}/${index}`),
        sourceOrder: index,
        text: resolveText(
          row[textField],
          path,
          `${field}/${index}/${textField}`,
        ),
        speaker: {
          externalId: roleId === undefined ? null : String(roleId),
          roleType: typeof roleType === 'string' ? roleType : null,
          name: speakerText?.status === 'available' ? speakerText.value : null,
        },
        nextSegmentIds: next.filter((id) => id !== 0).map(segmentId),
        endsConversation: next.length === 0 || next.includes(0),
        original: parse(z.json(), row, path),
      });
    });
  }

  for (const id of selection.quests) {
    const path = `BinOutput/Quest/${id}.json`;
    const quest = record(json(path), path);
    if (quest.id !== id)
      fail(
        'INVALID_REFERENCE',
        path,
        'id',
        String(id),
        'ID de misión distinto al solicitado',
      );
    const { row: metadata, index } = lookup('MainQuest', id);
    const source = create(
      `agd-quest-${id}-es`,
      id,
      'mission',
      title(
        metadata.titleTextMapHash,
        tablePath('MainQuest'),
        `${index}/titleTextMapHash`,
      ),
      origin(path),
      { quest, metadata },
      [rowOrigin('MainQuest', index)],
    );
    for (const entry of list(quest.DLLABGGCEBM, path, 'DLLABGGCEBM')) {
      const talk = record(entry, path, 'DLLABGGCEBM');
      const talkId = number(talk.id, path, 'DLLABGGCEBM/id');
      conversation(
        source,
        `BinOutput/Talk/Quest/${talkId}.json`,
        number(talk.NNEHBCLEGHG, path, 'DLLABGGCEBM/NNEHBCLEGHG'),
        String(talkId),
      );
    }
    sources.push(source);
  }
  for (const id of selection.ambientNpcs) {
    const path = `BinOutput/Talk/NpcGroup/${id}.json`;
    const group = record(json(path), path);
    const { row: npc, index } = lookup('Npc', id);
    const source = create(
      `agd-npc-${id}-es`,
      id,
      'ambient-dialogue',
      title(npc.nameTextMapHash, tablePath('Npc'), `${index}/nameTextMapHash`),
      origin(path),
      group,
      [rowOrigin('Npc', index)],
    );
    for (const entry of list(group.DLLABGGCEBM, path, 'DLLABGGCEBM')) {
      const talk = record(entry, path, 'DLLABGGCEBM');
      const talkId = number(talk.id, path, 'DLLABGGCEBM/id');
      const children = list(talk.CAMBAICPKPH ?? [], path, 'CAMBAICPKPH');
      if (
        !children.every((id) =>
          (group.DLLABGGCEBM as Raw[]).some((item) => item.id === id),
        )
      )
        fail(
          'DANGLING_REFERENCE',
          path,
          'CAMBAICPKPH',
          String(talkId),
          'Opción del menú sin conversación',
        );
      conversation(
        source,
        `BinOutput/Talk/Npc/${talkId}.json`,
        number(talk.NNEHBCLEGHG, path, 'NNEHBCLEGHG'),
        String(talkId),
      );
    }
    sources.push(source);
  }
  for (const item of selection.hangouts) {
    const { row: chapter, index } = lookup('CoopChapter', item.chapterId);
    const points = rows('CoopPoint').filter(
      (row) => row.chapterId === item.chapterId,
    );
    if (!points.length)
      fail(
        'EMPTY_SOURCE',
        tablePath('CoopPoint'),
        'chapterId',
        String(item.chapterId),
        'Encuentro sin puntos',
      );
    for (const point of points) {
      for (const next of list(
        point.postPointList ?? [],
        tablePath('CoopPoint'),
        'postPointList',
      )) {
        if (!points.some((target) => target.id === next))
          fail(
            'DANGLING_REFERENCE',
            tablePath('CoopPoint'),
            'postPointList',
            String(point.id),
            'Rama del encuentro sin destino',
          );
      }
    }
    const source = create(
      `agd-coop-${item.chapterId}-es`,
      item.chapterId,
      'hangout',
      title(
        chapter.chapterNameTextMapHash,
        tablePath('CoopChapter'),
        `${index}/chapterNameTextMapHash`,
      ),
      rowOrigin('CoopChapter', index),
      { chapter, points },
      [origin(tablePath('CoopPoint'))],
    );
    for (const file of item.conversationFiles) {
      const match = /^BinOutput\/Talk\/Coop\/(\d+_\d+)\.json$/.exec(file);
      if (!match)
        fail(
          'INVALID_SELECTION',
          file,
          '',
          source.id,
          'Ruta Coop no reconocida',
        );
      conversation(source, file, null, match[1]!, true);
    }
    sources.push(source);
  }

  const bareSegment = (
    id: string,
    externalId: string,
    locator: SourceLocator,
    sourceOrder: number,
    text: ImportedText,
    original: unknown,
  ): SourceSegment => ({
    id,
    externalId,
    locator,
    sourceOrder,
    text,
    speaker: { externalId: null, roleType: null, name: null },
    nextSegmentIds: [],
    endsConversation: true,
    original: parse(z.json(), original, locator.path),
  });
  for (const item of selection.documents) {
    const { row: document, index } = lookup('Document', item.id);
    const source = create(
      `agd-document-${item.id}-es`,
      item.id,
      item.kind,
      title(
        document.titleTextMapHash,
        tablePath('Document'),
        `${index}/titleTextMapHash`,
      ),
      rowOrigin('Document', index),
      document,
    );
    const catalogName =
      item.kind === 'book'
        ? 'BooksCodex'
        : item.kind === 'weapon-story'
          ? 'Weapon'
          : item.kind === 'artifact-story'
            ? 'Reliquary'
            : null;
    if (catalogName) {
      const key = item.kind === 'book' ? 'materialId' : 'storyId';
      const matches = rows(catalogName)
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row[key] === item.id);
      if (!matches.length)
        fail(
          'INVALID_REFERENCE',
          tablePath(catalogName),
          key,
          String(item.id),
          'El documento no pertenece a la categoría seleccionada',
        );
      source.context = parse(
        z.json(),
        { document, catalog: matches.map(({ row }) => row) },
        tablePath(catalogName),
      );
      source.metadataLocators.push(
        ...matches.map(({ index }) => rowOrigin(catalogName, index)),
      );
    }
    const localizationIds = list(
      document.questIDList,
      tablePath('Document'),
      `${index}/questIDList`,
    );
    for (const [position, id] of localizationIds.entries()) {
      const { row: localization, index: localIndex } = lookup(
        'Localization',
        number(id, tablePath('Document'), 'questIDList'),
      );
      if (
        typeof localization.esPath !== 'string' ||
        !localization.esPath.startsWith('ART/UI/Readable/ES/')
      )
        fail(
          'MISSING_TRANSLATION',
          tablePath('Localization'),
          `${localIndex}/esPath`,
          String(id),
          'No hay ruta española de documento',
        );
      const path = localization.esPath.slice('ART/UI/'.length) + '.txt';
      const value = decoded.get(path);
      if (!value?.length)
        fail(
          'MISSING_FILE',
          path,
          '',
          String(id),
          'Documento requerido ausente o vacío',
        );
      source.metadataLocators.push(rowOrigin('Localization', localIndex));
      source.segments.push(
        bareSegment(
          `${source.id}-localization-${id}`,
          String(id),
          origin(path),
          position,
          {
            status: 'available',
            value,
            sha256: sha256(value),
            textMapHash: null,
            origin: origin(path),
          },
          localization,
        ),
      );
    }
    sources.push(source);
  }
  for (const id of selection.characterStories) {
    const { row: story, index } = lookup('FetterStory', id, 'fetterId');
    const { row: avatar, index: avatarIndex } = lookup(
      'Avatar',
      number(story.avatarId, tablePath('FetterStory'), 'avatarId'),
    );
    const locator = rowOrigin('FetterStory', index);
    const source = create(
      `agd-fetter-${id}-es`,
      id,
      'character-story',
      title(
        story.storyTitleTextMapHash,
        locator.path,
        `${index}/storyTitleTextMapHash`,
      ),
      locator,
      { story, avatar },
      [rowOrigin('Avatar', avatarIndex)],
    );
    source.segments.push(
      bareSegment(
        `${source.id}-text`,
        String(id),
        { ...locator, pointer: `/${index}/storyContextTextMapHash` },
        0,
        resolveText(
          story.storyContextTextMapHash,
          locator.path,
          `${index}/storyContextTextMapHash`,
        ),
        story,
      ),
    );
    sources.push(source);
  }
  sources.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return parse(
    ImportedDatasetSchema,
    {
      schemaVersion: 1,
      adapterVersion: ADAPTER,
      snapshot: manifest,
      selectionSha256: sha256(stableJson(selection)),
      sources,
    },
    'candidate/sources.json',
  );
}
