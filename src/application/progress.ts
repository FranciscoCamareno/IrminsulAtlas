import type { AtlasIndex } from '../domain/schema';

// A choice is either nothing, "up to" an ordered milestone (which also grants
// every earlier one), or everything. It never depends on historical order.
export type ProgressChoice =
  { kind: 'none' } | { kind: 'upto'; milestoneId: string } | { kind: 'all' };

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
      const end = milestones.findIndex(
        (item) => item.id === choice.milestoneId,
      );
      return new Set(milestones.slice(0, end + 1).map((item) => item.id));
    }
  }
}

export function isValidChoice(
  choice: ProgressChoice,
  milestones: AtlasIndex['milestones'],
): boolean {
  return (
    choice.kind !== 'upto' ||
    milestones.some((item) => item.id === choice.milestoneId)
  );
}

const STORAGE_KEY = 'irminsul-atlas:progress:v1';

function parseChoice(raw: string | null): ProgressChoice | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== 'object' || value === null) return null;
    const { kind, milestoneId } = value as Record<string, unknown>;
    if (kind === 'none' || kind === 'all') return { kind };
    if (kind === 'upto' && typeof milestoneId === 'string')
      return { kind, milestoneId };
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
  try {
    return storage()?.getItem(STORAGE_KEY) ?? memory;
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
  try {
    storage()?.setItem(STORAGE_KEY, raw);
    memory = null;
  } catch {
    memory = raw;
  }
  listeners.forEach((listener) => listener());
}
