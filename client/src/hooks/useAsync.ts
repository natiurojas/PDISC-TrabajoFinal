import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../lib/api';

interface AsyncState<T> {
  status: 'loading' | 'success' | 'error';
  data: T | undefined;
  error: string | undefined;
}

/**
 * Pequeno cargador de datos con cancelacion. `deps` controla la recarga.
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: undefined,
    error: undefined,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((previous) => ({ status: 'loading', data: previous.data, error: undefined }));

    loader(controller.signal)
      .then((data) => {
        if (active) setState({ status: 'success', data, error: undefined });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error', data: undefined, error: errorMessage(error) });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}

/** Retrasa un valor para no disparar busquedas en cada pulsacion. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
