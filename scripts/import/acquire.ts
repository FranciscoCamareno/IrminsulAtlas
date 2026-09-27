import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SnapshotManifest } from '../../src/domain/schema.ts';
import { fail, gitBlob, safePath, sha256 } from './shared.ts';

export function verifyFile(
  file: SnapshotManifest['files'][number],
  bytes: Uint8Array,
): void {
  if (
    bytes.length !== file.bytes ||
    sha256(bytes) !== file.sha256 ||
    gitBlob(bytes) !== file.gitBlobSha1
  )
    fail(
      'CHECKSUM_MISMATCH',
      file.path,
      'sha256/bytes/gitBlobSha1',
      null,
      'El archivo no coincide con el snapshot',
    );
}

// Reading/normalizing never downloads. This is the only acquisition entry point.
export async function acquireSnapshot(
  manifest: SnapshotManifest,
  cache: string,
  request: typeof fetch = fetch,
): Promise<void> {
  if (manifest.contentOrigin !== 'provider')
    fail(
      'SYNTHETIC_DOWNLOAD',
      'manifest',
      'contentOrigin',
      null,
      'Los fixtures no se adquieren de la red',
    );
  await mkdir(cache, { recursive: true });
  for (const file of manifest.files) {
    const target = await safePath(cache, file.path);
    let bytes: Buffer | undefined;
    try {
      bytes = await readFile(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (bytes) {
      verifyFile(file, bytes);
      continue;
    }
    const url = `https://raw.githubusercontent.com/DimbreathBot/AnimeGameData/${manifest.commit}/${file.path}`;
    try {
      const response = await request(url, {
        signal: AbortSignal.timeout(60000),
        redirect: 'error',
      });
      if (!response.ok)
        fail('DOWNLOAD_FAILED', file.path, '', null, `HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    } catch {
      fail(
        'DOWNLOAD_FAILED',
        file.path,
        '',
        null,
        'Descarga fallida o interrumpida',
      );
    }
    verifyFile(file, bytes);
    await mkdir(dirname(target), { recursive: true });
    const temporary = target + '.' + randomUUID() + '.tmp';
    try {
      await writeFile(temporary, bytes, { flag: 'wx' });
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
  }
}

export async function readSnapshot(
  manifest: SnapshotManifest,
  cache: string,
): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();
  for (const file of manifest.files) {
    let bytes: Buffer;
    const target = await safePath(cache, file.path);
    try {
      bytes = await readFile(target);
    } catch {
      fail(
        'MISSING_FILE',
        file.path,
        '',
        null,
        'Archivo requerido ausente; ejecutar content:acquire de forma explícita',
      );
    }
    verifyFile(file, bytes);
    result.set(file.path, bytes);
  }
  return result;
}
