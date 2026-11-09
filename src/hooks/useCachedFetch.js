'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { readClientCache, writeClientCache } from '@/lib/clientDataCache';

/**
 * Fetch with in-memory cache: first visit shows loading; revisits show cached data instantly.
 * pollInterval refreshes silently in the background.
 */
export default function useCachedFetch(cacheKey, fetcher, options = {}) {
  const { ttl = 120000, pollInterval = 0, enabled = true } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState(() => (enabled ? readClientCache(cacheKey) : null));
  const [loading, setLoading] = useState(() => enabled && !readClientCache(cacheKey));
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(
    async (silent = false) => {
      if (!enabled || !cacheKey) return;
      const hasCache = readClientCache(cacheKey) != null;
      if (!silent && !hasCache) setLoading(true);
      if (silent) setRefreshing(true);
      try {
        const result = await fetcherRef.current();
        writeClientCache(cacheKey, result, ttl);
        setData(result);
      } catch (e) {
        console.warn('[useCachedFetch]', cacheKey, e?.message || e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cacheKey, enabled, ttl]
  );

  useEffect(() => {
    if (!enabled) return;
    const cached = readClientCache(cacheKey);
    run(Boolean(cached));
    if (!pollInterval || pollInterval < 1000) return undefined;
    const interval = setInterval(() => run(true), pollInterval);
    return () => clearInterval(interval);
  }, [cacheKey, enabled, pollInterval, run]);

  const refresh = useCallback(() => run(false), [run]);

  return { data, setData, loading, refreshing, refresh, hasCache: data != null };
}
