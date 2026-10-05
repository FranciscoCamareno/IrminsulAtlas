import type { AtlasIndex } from '../domain/schema';

// A choice is nothing, "up to" an ordered main-story milestone (which also
// grants every earlier main one) plus any optional milestones ticked one by
// one, or everything. Reaching a region never grants an optional milestone, and
// it never depends on historical order.
export type ProgressChoice =
  | { kind: 'none' }
  | { kind: 'upto'; milestoneId: string; optional?: readonly string[] }
  | { kind: 'all' };

const mainLadder = (milestones: AtlasIndex['milestones']) =>
  milestones.filter((item) => item.track === 'main');

export function progressSet(
  choice: ProgressChoice,
  milestones: AtlasIndex['milestones'],
): Set<string> {
  switch (choice.kind) {
    case 'none':
      return new Set();
    case 'all':
      return new Set(milestones.map((milestone) => milestone.id));
    case 'upto': {
      const ladder = mainLadder(milestones);
      const end = ladder.findIndex((item) => item.id === choice.milestoneId);
      const granted = new Set(ladder.slice(0, end + 1).map((item) => item.id));
      // An unknown milestone, or a main one passed as optional, grants nothing.
      for (const id of choice.optional ?? [])
        if (
          milestones.some((item) => item.id === id && item.track === 'optional')
        )
          granted.add(id);
      return granted;
    }
  }
}

export function isValidChoice(
  choice: ProgressChoice,
  milestones: AtlasIndex['milestones'],
): boolean {
  return (
    choice.kind !== 'upto' ||
    mainLadder(milestones).some((item) => item.id === choice.milestoneId)
  );
}

// v2 added optional milestones. A v1 value is read as is (it never carried
// optional ones, so it grants exactly what it did before) and replaced by v2 on
// the next choice.
const STORAGE_KEY = 'irminsul-atlas:progress:v2';
const LEGACY_KEY = 'irminsul-atlas:progress:v1';

function parseChoice(raw: string | null): ProgressChoice | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== 'object' || value === null) return null;
    const { kind, milestoneId, optional } = value as Record<string, unknown>;
    if (kind === 'none' || kind === 'all') return { kind };
    if (kind === 'upto' && typeof milestoneId === 'string') {
      const picked = Array.isArray(optional)
        ? [...new Set(optional.filter((id) => typeof id === 'string'))]
        : [];
      return picked.length
        ? { kind, milestoneId, optional: picked }
        : { kind, milestoneId };
    }
  } catch {
    // Corrupt storage is treated as "undecided".
  }
  return null;
}

// The choice lives in local storage, exposed as an external store so React can
// read it without effects. If storage is blocked it lasts for this page view.
let memory: string | null = null;
const listeners = new Set<() => void>();

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

// Snapshots are raw strings, so equal values never trigger a re-render.
export function getChoiceSnapshot(): string | null {
  // A failed write must not let an older persisted value override this choice.
  if (memory !== null) return memory;
  try {
    const target = storage();
    return target?.getItem(STORAGE_KEY) ?? target?.getItem(LEGACY_KEY) ?? null;
  } catch {
    return memory;
  }
}
export const getServerChoiceSnapshot = () => null;
export function subscribeChoice(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}
export const choiceFromSnapshot = parseChoice;

export function storeChoice(choice: ProgressChoice): void {
  const raw = JSON.stringify(choice);
  memory = raw;
  try {
    const target = storage();
    if (target) {
      target.setItem(STORAGE_KEY, raw);
      memory = null;
    }
  } catch {
    // Keep the latest choice in memory when access or writes are blocked.
  }
  listeners.forEach((listener) => listener());
}
