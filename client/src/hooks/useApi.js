import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../utils/errors';

/** Runs an async loader and exposes { data, loading, error, reload }. Re-runs when `deps` change. */
export default function useApi(loader, deps = []) {
  const ref = useRef(loader);
  ref.current = loader;
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    ref.current()
      .then((data) => alive && setState({ data, loading: false, error: '' }))
      .catch((err) => alive && setState({ data: null, loading: false, error: apiErrorMessage(err, 'We could not load this data.') }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
