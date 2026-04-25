/**
 * Simple localStorage cache with TTL.
 * Implements Stale-While-Revalidate:
 *  - Returns cached data immediately (instant UI)
 *  - Refetches in background and updates when fresh data arrives
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(key) {
  return `__cache__${key}`;
}

/** Write data to cache */
export function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
  try {
    localStorage.setItem(
      cacheKey(key),
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs })
    );
  } catch {
    // localStorage full — skip silently
  }
}

/** Read from cache. Returns null if missing or expired. */
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(cacheKey(key));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Remove a specific cache entry */
export function cacheDelete(key) {
  localStorage.removeItem(cacheKey(key));
}

/** Clear all cache entries created by this utility */
export function cacheClear() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("__cache__"))
    .forEach((k) => localStorage.removeItem(k));
}

/**
 * Stale-While-Revalidate fetch.
 *
 * @param {string} cacheKeyStr - unique key for this request
 * @param {() => Promise<any>} fetcher - async fn returning fresh data
 * @param {(data: any) => void} onData - called immediately with cached data, then again with fresh
 * @param {number} ttlMs - how long to consider cache valid
 */
export async function swrFetch(cacheKeyStr, fetcher, onData, ttlMs = DEFAULT_TTL_MS) {
  // 1. Show stale data immediately if available
  const stale = cacheGet(cacheKeyStr);
  if (stale !== null) {
    onData(stale);
  }

  // 2. Always fetch fresh data in background
  try {
    const fresh = await fetcher();
    cacheSet(cacheKeyStr, fresh, ttlMs);
    onData(fresh);
  } catch (err) {
    // If fetch fails but we already showed stale — that's fine
    if (stale === null) throw err;
  }
}
