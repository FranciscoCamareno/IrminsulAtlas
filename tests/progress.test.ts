import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('progress when browser storage fails', () => {
  it('keeps the latest choice when accessing localStorage throws', async () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('SecurityError');
      },
    });
    const { storeChoice, getChoiceSnapshot, choiceFromSnapshot } =
      await import('../src/application/progress');
    storeChoice({ kind: 'all' });
    expect(choiceFromSnapshot(getChoiceSnapshot())).toEqual({ kind: 'all' });
    storeChoice({ kind: 'none' });
    expect(choiceFromSnapshot(getChoiceSnapshot())).toEqual({ kind: 'none' });
  });

  it('does not restore an older persisted choice after a rejected write', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify({ kind: 'all' }),
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
    });
    const { storeChoice, getChoiceSnapshot, choiceFromSnapshot } =
      await import('../src/application/progress');
    expect(choiceFromSnapshot(getChoiceSnapshot())).toEqual({ kind: 'all' });
    storeChoice({ kind: 'none' });
    expect(choiceFromSnapshot(getChoiceSnapshot())).toEqual({ kind: 'none' });
  });

  it('keeps a choice without storage and persists it once storage is usable', async () => {
    const target: {
      localStorage?: {
        getItem: () => string | null;
        setItem: (_key: string, value: string) => void;
      };
    } = {};
    vi.stubGlobal('window', target);
    const { storeChoice, getChoiceSnapshot, choiceFromSnapshot } =
      await import('../src/application/progress');
    storeChoice({ kind: 'all' });
    expect(choiceFromSnapshot(getChoiceSnapshot())).toEqual({ kind: 'all' });
    let saved: string | null = null;
    target.localStorage = {
      getItem: () => saved,
      setItem: (_key, value) => {
        saved = value;
      },
    };
    storeChoice({ kind: 'upto', milestoneId: 'hito-mondstadt' });
    expect(saved).toBe(getChoiceSnapshot());
    expect(choiceFromSnapshot(saved)).toEqual({
      kind: 'upto',
      milestoneId: 'hito-mondstadt',
    });
  });
});
