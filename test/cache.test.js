// Unit tests for the TTL cache in lib/cache.js.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { createCache } = require("../lib/cache");

test("cacheSet then cacheGet returns the stored value", () => {
  const c = createCache();
  c.cacheSet("k", { n: 1 }, 1000);
  assert.deepEqual(c.cacheGet("k"), { n: 1 });
});

test("cacheGet returns null for an unknown key", () => {
  const c = createCache();
  assert.equal(c.cacheGet("missing"), null);
});

test("an entry expires once its TTL has passed", () => {
  let clock = 1000;
  const c = createCache({ now: () => clock });
  c.cacheSet("k", "v", 500);
  assert.equal(c.cacheGet("k"), "v");
  clock += 501;
  assert.equal(c.cacheGet("k"), null);
});

test("an expired key is deleted, not merely hidden", () => {
  let clock = 0;
  const c = createCache({ now: () => clock });
  c.cacheSet("k", "v", 10);
  clock = 100;
  c.cacheGet("k");
  assert.equal(c.size(), 0);
});

test("the cache trims the oldest entry once past maxEntries", () => {
  const c = createCache({ maxEntries: 2 });
  c.cacheSet("a", 1, 1000);
  c.cacheSet("b", 2, 1000);
  c.cacheSet("c", 3, 1000);
  assert.equal(c.size(), 2);
  assert.equal(c.cacheGet("a"), null);
  assert.equal(c.cacheGet("c"), 3);
});

test("re-setting a key updates both value and TTL", () => {
  let clock = 0;
  const c = createCache({ now: () => clock });
  c.cacheSet("k", "old", 10);
  clock = 5;
  c.cacheSet("k", "new", 10);
  clock = 12;
  assert.equal(c.cacheGet("k"), "new");
});
