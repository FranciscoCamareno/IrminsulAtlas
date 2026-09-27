import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import {
  SnapshotPathSchema,
  type ImportIssue,
} from '../../src/domain/schema.ts';

export const ADAPTER = 'animegamedata-7.1-p1-v1' as const;
export const SNAPSHOT = 'b061b403c8afc7bca633cf4f201edc4a3baa75fe';
export const sha256 = (input: string | Uint8Array) =>
  createHash('sha256').update(input).digest('hex');
export const gitBlob = (bytes: Uint8Array) =>
  createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');

// Sort object keys, but preserve arrays: choices and provider order are meaningful.
export function stableJson(value: unknown): string {
  const sort = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sort);
    if (item !== null && typeof item === 'object')
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, child]) => [key, sort(child)]),
      );
    return item;
  };
  return JSON.stringify(sort(value), null, 2) + '\n';
}

export class ImportFailure extends Error {
  readonly issue: ImportIssue;
  constructor(issue: ImportIssue) {
    super(
      `${issue.code}: ${issue.file} ${issue.field} [${issue.id ?? '-'}] ${issue.message}`,
    );
    this.issue = issue;
  }
}
export function fail(
  code: string,
  file: string,
  field: string,
  id: string | null,
  message: string,
  category = 'input',
): never {
  throw new ImportFailure({
    severity: 'error',
    code,
    file,
    field,
    id,
    message,
    category,
  });
}

// Node 24 exposes the original numeric token to the JSON reviver. Large opaque
// integers remain decimal strings instead of rounded Numbers; raw bytes are kept.
export function exactJson(input: string, file: string): unknown {
  try {
    return JSON.parse(
      input,
      (_key, value: unknown, context?: { source?: string }) => {
        if (
          typeof value === 'number' &&
          (!Number.isFinite(value) ||
            (Number.isInteger(value) && !Number.isSafeInteger(value)))
        ) {
          if (!context?.source || !/^-?\d+$/.test(context.source))
            fail(
              'UNSAFE_NUMBER',
              file,
              '',
              null,
              'Número fuera del rango exacto no reconocido',
            );
          return context.source;
        }
        return value;
      },
    ) as unknown;
  } catch (error) {
    if (error instanceof ImportFailure) throw error;
    fail('INVALID_JSON', file, '', null, 'JSON inválido o truncado');
  }
}

export function parse<T>(
  schema: z.ZodType<T>,
  input: unknown,
  file: string,
  id: string | null = null,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0]!;
    fail('INVALID_SCHEMA', file, issue.path.join('.'), id, issue.message);
  }
  return result.data;
}
export async function readJson(file: string): Promise<unknown> {
  let bytes: string;
  try {
    bytes = await readFile(file, 'utf8');
  } catch {
    fail(
      'MISSING_FILE',
      file,
      '',
      null,
      'No se pudo leer el archivo requerido',
    );
  }
  return exactJson(bytes, file);
}

export function inside(base: string, relative: string): string {
  parse(SnapshotPathSchema, relative, relative);
  const root = resolve(base);
  const path = resolve(root, relative);
  if (!path.startsWith(root + sep))
    fail(
      'UNSAFE_PATH',
      relative,
      '',
      null,
      'Ruta fuera del directorio esperado',
    );
  return path;
}

// Check nearest existing parent too, so a symlink cannot redirect a new write.
export async function safePath(
  base: string,
  relative: string,
): Promise<string> {
  const target = inside(base, relative);
  const root = await realpath(base);
  let probe = target;
  for (;;) {
    try {
      const physical = await realpath(probe);
      if (physical !== root && !physical.startsWith(root + sep))
        fail(
          'UNSAFE_PATH',
          relative,
          '',
          null,
          'Enlace fuera del directorio esperado',
        );
      break;
    } catch (error) {
      if (error instanceof ImportFailure) throw error;
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = resolve(probe, '..');
      if (parent === probe) throw error;
      probe = parent;
    }
  }
  return target;
}
