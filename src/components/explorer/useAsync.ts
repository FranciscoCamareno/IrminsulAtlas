import { useCallback, useEffect, useState } from 'react';

export type Async<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

// `key` identifies what is being loaded: changing it never shows stale data
// from the previous key, and `retry` repeats a failed load.
export function useAsync<T>(
  key: string | null,
  load: () => Promise<T>,
): [Async<T>, () => void] {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    attempt: number;
    result: Async<T>;
  } | null>(null);
  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled)
          setState({ key, attempt, result: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            key,
            attempt,
            result: {
              status: 'error',
              message:
                error instanceof Error
                  ? error.message
                  : 'No se pudo cargar el contenido.',
            },
          });
      },
    );
    return () => {
      cancelled = true;
    };
    // `load` is recreated each render; the key and attempt define the request.
  }, [key, attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  if (key === null) return [{ status: 'idle' }, retry];
  if (state && state.key === key && state.attempt === attempt)
    return [state.result, retry];
  if (state && state.key === key && state.result.status === 'ready')
    return [state.result, retry];
  return [{ status: 'loading' }, retry];
}
