// Simple in-memory TTL cache for external feeds.
//
// Extracted out of server.js purely so it can be unit-tested: inline in a
// 2300-line file there was no way to exercise the expiry or eviction paths.
// `now` is injectable so tests can move time without sleeping.
function createCache({ maxEntries = 500, now = Date.now } = {}) {
  const store = new Map();

  function cacheGet(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (now() > hit.exp) { store.delete(key); return null; }
    return hit.val;
  }

  function cacheSet(key, val, ttlMs) {
    store.set(key, { val, exp: now() + ttlMs });
    if (store.size > maxEntries) { // simple LRU-ish trim: drop the oldest key
      const first = store.keys().next().value;
      store.delete(first);
    }
  }

  return { cacheGet, cacheSet, size: () => store.size, clear: () => store.clear() };
}

// Shared default instance, so callers can require these directly.
const shared = createCache();

module.exports = Object.assign({ createCache }, shared);
