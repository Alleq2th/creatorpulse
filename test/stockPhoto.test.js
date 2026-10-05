// Regression test: stock photos must work with ONLY an Unsplash key set.
//
// Why this test exists: the owner had UNSPLASH_ACCESS_KEY set on Render and no
// Pexels key (his Pexels signup failed). The old code read exactly one name per
// provider and, when both attempts failed, threw — the route turned that into a
// 503, which the UI shows as a hard failure rather than "no photo here". Two
// distinct defects, both covered below:
//
//   1. A key stored under an alternate spelling (UNSPLASH_API_KEY, etc.) was
//      invisible, because only UNSPLASH_ACCESS_KEY was read.
//   2. A missing/failing provider turned into a thrown 503 instead of an empty
//      list, so a purely cosmetic thumbnail could make the screen look broken.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const UNSPLASH_NAMES = ["UNSPLASH_ACCESS_KEY", "UNSPLASH_API_KEY", "UNSPLASH_KEY", "UNSPLASH_CLIENT_ID"];
const PEXELS_NAMES = ["PEXELS_API_KEY", "PEXELS_KEY"];

// ── Unit level: stub node-fetch, drive the service directly ──────────────────
function loadServiceWithFakeFetch(fakeFetch) {
  const svcPath = require.resolve("../services/stockPhoto");
  const fetchPath = require.resolve("node-fetch");
  const hadFetch = Object.prototype.hasOwnProperty.call(require.cache, fetchPath);
  const origFetchEntry = require.cache[fetchPath];
  require.cache[fetchPath] = {
    id: fetchPath, filename: fetchPath, loaded: true, exports: fakeFetch, children: [], paths: [],
  };
  delete require.cache[svcPath];
  const svc = require(svcPath);
  // Restore immediately — the service captured the fake at require time.
  if (hadFetch) require.cache[fetchPath] = origFetchEntry;
  else delete require.cache[fetchPath];
  return svc;
}

function withEnv(vars, fn) {
  const saved = {};
  for (const k of [...UNSPLASH_NAMES, ...PEXELS_NAMES]) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  Object.assign(process.env, vars);
  try { return fn(); } finally {
    for (const k of [...UNSPLASH_NAMES, ...PEXELS_NAMES]) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test("Unsplash alone returns photos, without any Pexels key", () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ urls: { regular: "https://images.unsplash.com/photo-1.jpg", thumb: "https://images.unsplash.com/thumb-1.jpg" },
                    user: { name: "A Photographer", links: { html: "https://unsplash.com/@a" } } }],
      }),
    };
  };
  return withEnv({ UNSPLASH_ACCESS_KEY: "real_unsplash_key" }, async () => {
    const svc = loadServiceWithFakeFetch(fakeFetch);
    const photos = await svc.searchRealPhotos("stadium lights", 1);
    assert.equal(photos.length, 1, "Unsplash alone must yield a photo");
    assert.equal(photos[0].source, "unsplash");
    assert.equal(photos[0].url, "https://images.unsplash.com/photo-1.jpg");
    assert.equal(calls.length, 1, "Pexels must NOT be called when Unsplash succeeds");
  });
});

test("the Unsplash key is accepted under alternate spellings", async () => {
  const fakeFetch = async () => ({
    ok: true, status: 200,
    json: async () => ({ results: [{ urls: { regular: "u", thumb: "t" }, user: { name: "n", links: { html: "h" } } }] }),
  });
  for (const name of UNSPLASH_NAMES) {
    await withEnv({ [name]: "key_under_" + name }, async () => {
      const svc = loadServiceWithFakeFetch(fakeFetch);
      const resolved = svc.unsplashKey();
      assert.ok(resolved, `${name} must be recognised`);
      assert.equal(resolved.name, name);
      const photos = await svc.searchRealPhotos("anything", 1);
      assert.equal(photos.length, 1, `${name} must be usable`);
    });
  }
});

test("a whitespace-only key counts as NOT set (a half-filled Render entry)", async () => {
  await withEnv({ UNSPLASH_ACCESS_KEY: "   \n  " }, async () => {
    const svc = loadServiceWithFakeFetch(async () => { throw new Error("must not be called"); });
    assert.equal(svc.unsplashKey(), null, "a blank key must not be treated as configured");
    const photos = await svc.searchRealPhotos("x", 1);
    assert.deepEqual(photos, [], "no key must degrade to an empty list, not a throw");
  });
});

test("a rejected key degrades to an empty list instead of throwing", async () => {
  await withEnv({ UNSPLASH_ACCESS_KEY: "bad_key" }, async () => {
    const svc = loadServiceWithFakeFetch(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const photos = await svc.searchRealPhotos("x", 1);
    assert.deepEqual(photos, [], "a 401 must not surface as a crash");
  });
});

test("a failure with no Pexels key still degrades gracefully", async () => {
  await withEnv({ UNSPLASH_ACCESS_KEY: "bad_key" }, async () => {
    const svc = loadServiceWithFakeFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    await assert.doesNotReject(() => svc.searchRealPhotos("x", 1), "must never throw");
  });
});

// ── HTTP level: the real server, only ONE key set ────────────────────────────
function waitForHealth(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(`http://127.0.0.1:${port}/api/health`)
        .then((r) => r.json()).then(resolve)
        .catch((err) => {
          if (Date.now() > deadline) return reject(err);
          setTimeout(attempt, 250);
        });
    };
    attempt();
  });
}

async function withServer(port, overrides, fn) {
  const env = { ...process.env, PORT: String(port), NODE_ENV: "test" };
  for (const k of [...UNSPLASH_NAMES, ...PEXELS_NAMES]) delete env[k];
  Object.assign(env, overrides);
  const proc = spawn(process.execPath, ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (d) => { stderr += d.toString(); });
  proc.stdout.on("data", () => {});
  try {
    const health = await waitForHealth(port, 15000);
    return await fn(health, port);
  } catch (err) {
    throw new Error(`server did not come up on ${port}. stderr:\n${stderr.slice(0, 1200)}\n${err.message}`);
  } finally {
    proc.kill("SIGTERM");
  }
}

test("with only UNSPLASH_ACCESS_KEY: health says unsplash:true, pexels:false", { timeout: 30000 }, async () => {
  await withServer(3981, { UNSPLASH_ACCESS_KEY: "dummy_unsplash_test_key" }, async (health) => {
    assert.equal(health.integrations.unsplash, true, "unsplash must read as configured");
    assert.equal(health.integrations.pexels, false, "pexels is genuinely absent");
    assert.equal(health.integrations.stockPhotos, true, "photos must be usable with Unsplash alone");
  });
});

test("with only UNSPLASH_API_KEY (alias): health still says unsplash:true", { timeout: 30000 }, async () => {
  await withServer(3982, { UNSPLASH_API_KEY: "dummy_alias_key" }, async (health) => {
    assert.equal(health.integrations.unsplash, true, "the alias must be recognised");
    assert.equal(health.integrations.stockPhotos, true);
  });
});

test("with no key at all: the route returns 200 + empty list, never a 503", { timeout: 30000 }, async () => {
  await withServer(3983, {}, async (_health, port) => {
    const r = await fetch(`http://127.0.0.1:${port}/api/stock-photo?query=football&count=1`);
    assert.equal(r.status, 200, "a missing key must not be a hard failure");
    const body = await r.json();
    assert.deepEqual(body.photos, [], "photos must be an empty list");
    assert.match(body.note || "", /UNSPLASH_ACCESS_KEY/, "the note must name the variable to set");
    // The old code threw this exact string and the route turned it into a 503.
    assert.doesNotMatch(JSON.stringify(body), /No photo provider configured or available/);
  });
});

test("with only UNSPLASH_ACCESS_KEY: the route does not 503 (key IS sent)", { timeout: 30000 }, async () => {
  await withServer(3984, { UNSPLASH_ACCESS_KEY: "dummy_unsplash_test_key" }, async (_health, port) => {
    const r = await fetch(`http://127.0.0.1:${port}/api/stock-photo?query=football%20stadium&count=1`);
    assert.equal(r.status, 200, "must not be a hard failure just because Pexels is missing");
    const body = await r.json();
    assert.ok(Array.isArray(body.photos), "photos must always be an array");
    // With a dummy key Unsplash answers 401 and we degrade to []. What matters
    // is that the request reached the provider — "no unsplash key" would mean
    // the key was never read at all, which is the bug this guards.
    assert.doesNotMatch(JSON.stringify(body), /no unsplash key/,
      "the key must be read and sent, not reported missing");
  });
});

test("the status endpoint reports which variables were found", { timeout: 30000 }, async () => {
  await withServer(3985, { UNSPLASH_ACCESS_KEY: "dummy" }, async (_health, port) => {
    const s = await (await fetch(`http://127.0.0.1:${port}/api/stock-photo/status`)).json();
    assert.equal(s.usable, true);
    assert.equal(s.unsplash, true);
    assert.equal(s.pexels, false);
    assert.equal(s.unsplashVar, "UNSPLASH_ACCESS_KEY");
    assert.equal(s.pexelsVar, null);
    // Never leak the key value itself.
    assert.doesNotMatch(JSON.stringify(s), /dummy/);
  });
});
