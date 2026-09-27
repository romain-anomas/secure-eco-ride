import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../services/api.js';

/** Loads GET `url`. Returns { data, loading, error, reload }. `initial` is shown until data arrives / if it fails. */
export default function useFetch(url, { params, initial = null, enabled = true } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const key = JSON.stringify(params || {});
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await get(url, params);
      if (alive.current) { setData(res.data); setMeta(res.meta ?? null); }
      return res;
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key, enabled]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  return { data, meta, loading, error, reload: load, setData };
}
