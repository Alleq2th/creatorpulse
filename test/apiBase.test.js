// Tests for lib/apiBase.js — the file that decides which machine is the
// backend.
//
// This is the regression guard for the bug that made every photo, caption and
// news request fail: on GitHub Pages `window.location.origin` is a static file
// host, so `fetch(API + '/api/...')` asked a machine that cannot answer. The
// resolver must return the real backend for static hosts and the same origin
// everywhere else.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = fs.readFileSync(path.join(__dirname, "..", "public", "lib", "apiBase.js"), "utf8");

// This is the address the app must fall back to on a static-only host.
// It is asserted here on purpose: it went stale once (it named a retired Render
// service that answered 503 "Service Suspended"), and that single stale string
// is what made every photo, caption and notification fail for real people while
// the actual server was healthy at a different name.
const BACKEND = "https://creatorpulse-3khg.onrender.com";

// Run the file in a sandboxed "browser" and hand back the globals it creates.
// `metaSeed` simulates <meta name="aria-api-base-seed"> - the tag our own server
// stamps into index.html at boot (and the static build stamps at build time).
function runInBrowser({ hostname = "creatorpulse-3khg.onrender.com", protocol = "https:", origin, store = {}, metaSeed = "" } = {}) {
  const loc = {
    hostname,
    protocol,
    origin: origin || `${protocol}//${hostname}`,
    href: `${origin || `${protocol}//${hostname}`}/`,
  };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  const sandbox = {
    window: {},
    document: {
      querySelector: (sel) => {
        if (metaSeed && String(sel).indexOf("aria-api-base-seed") !== -1) {
          return { getAttribute: () => metaSeed };
        }
        return null;
      },
    },
    localStorage,
    location: loc,
    fetch: () => Promise.reject(new Error("no network in tests")),
    AbortController: function () { this.signal = {}; this.abort = () => {}; },
    setTimeout, clearTimeout, console,
    URL,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return sandbox;
}

test("apiBase.js defines the documented public surface", () => {
  const w = runInBrowser();
  for (const fn of ["ariaApiBase", "ariaFetch", "ariaHealth", "ariaLearnBase"]) {
    assert.equal(typeof w[fn], "function", `window.${fn} should be a function`);
  }
  assert.equal(typeof w.__ariaResolveStatic, "function");
});

test("on a static file host, /api calls go to the real backend", () => {
  const w = runInBrowser({ hostname: "alleq2th.github.io", origin: "https://alleq2th.github.io" });
  assert.equal(w.ariaApiBase(), BACKEND);
});

test("every static host in the list resolves to the backend", () => {
  const hosts = [
    "alleq2th.github.io", "foo.gitlab.io", "thing.netlify.app",
    "proj.vercel.app", "x.pages.dev", "app.surge.sh", "site.web.app",
  ];
  for (const hostname of hosts) {
    const w = runInBrowser({ hostname, origin: `https://${hostname}` });
    assert.equal(w.ariaApiBase(), BACKEND, `${hostname} should resolve to the backend`);
  }
});

test("when our own Express server serves the page, the API stays same-origin", () => {
  const w = runInBrowser({ hostname: "creatorpulse-3khg.onrender.com" });
  assert.equal(w.ariaApiBase(), "https://creatorpulse-3khg.onrender.com");
});

test("a RENAMED service still resolves to itself, with no code change", () => {
  // The exact failure this suite guards against: the Render service was renamed
  // and the frontend kept asking the retired address, which answered 503. The
  // page's own origin must win over any frozen constant.
  const w = runInBrowser({
    hostname: "creatorpulse-somethingnew.onrender.com",
    origin: "https://creatorpulse-somethingnew.onrender.com",
  });
  assert.equal(w.ariaApiBase(), "https://creatorpulse-somethingnew.onrender.com");
});

test("a static host uses the build/boot seed when one was stamped into the page", () => {
  const w = runInBrowser({
    hostname: "alleq2th.github.io",
    origin: "https://alleq2th.github.io",
    metaSeed: "https://some-new-service.onrender.com/",
  });
  assert.equal(w.ariaApiBase(), "https://some-new-service.onrender.com"); // trailing slash trimmed
});

test("without a seed, a static host falls back to the built-in backend", () => {
  const w = runInBrowser({ hostname: "alleq2th.github.io", origin: "https://alleq2th.github.io" });
  assert.equal(w.ariaApiBase(), BACKEND);
});

test("ariaSelfBase reports the page's own origin, and nothing on a file: URL", () => {
  const w = runInBrowser({ hostname: "creatorpulse-3khg.onrender.com" });
  assert.equal(typeof w.ariaSelfBase, "function");
  assert.equal(w.ariaSelfBase(), "https://creatorpulse-3khg.onrender.com");
  const f = runInBrowser({ protocol: "file:", hostname: "", origin: "null" });
  assert.equal(f.ariaSelfBase(), "", "a file: page has no backend origin to trust");
});

test("localhost keeps the dev port instead of jumping to production", () => {
  for (const hostname of ["localhost", "127.0.0.1", "0.0.0.0"]) {
    const w = runInBrowser({ hostname, protocol: "http:", origin: `http://${hostname}:3000` });
    assert.equal(w.ariaApiBase(), `http://${hostname}:3000`, `${hostname} should keep its own origin`);
  }
});

test("an explicit override always wins", () => {
  const w = runInBrowser({
    hostname: "alleq2th.github.io",
    origin: "https://alleq2th.github.io",
    store: { cp_api_base: "https://my-own-backend.example.com" },
  });
  assert.equal(w.ariaApiBase(), "https://my-own-backend.example.com");
});

test("a base proven to work is reused on a static host", () => {
  const w = runInBrowser({
    hostname: "alleq2th.github.io",
    origin: "https://alleq2th.github.io",
    store: { cp_api_base_ok: "https://learned.example.com" },
  });
  assert.equal(w.ariaApiBase(), "https://learned.example.com");
});

test("socket.io-style hosts that merely CONTAIN a static name are not static", () => {
  // The pattern must be anchored on a real dot boundary; otherwise a backend
  // called "mygithub.io-clone.com" would be wrongly sent to the fallback.
  const w = runInBrowser({ hostname: "mygithub.io-clone.com", origin: "https://mygithub.io-clone.com" });
  assert.equal(w.ariaApiBase(), "https://mygithub.io-clone.com");
});

test("resolveStatic is a pure rule table", () => {
  const w = runInBrowser();
  const r = w.__ariaResolveStatic;
  const base = {
    explicit: "", learnedOk: "", protocol: "https:", isLocal: false,
    isStaticHost: false, selfBase: "", origin: "https://x.com", defaultBackend: BACKEND,
  };
  assert.equal(r({ ...base, explicit: "https://a.com" }), "https://a.com");
  assert.equal(r({ ...base, learnedOk: "https://b.com" }), "https://b.com");
  assert.equal(r({ ...base, protocol: "file:" }), "");
  assert.equal(r({ ...base, isLocal: true, origin: "http://localhost:3000" }), "http://localhost:3000");
  assert.equal(r({ ...base, isStaticHost: true }), BACKEND);
  // The page's own origin beats the constant whenever the page came from a real
  // host that is not a static-only one - this is the rename-proof rule.
  assert.equal(r({ ...base, selfBase: "https://renamed.onrender.com" }), "https://renamed.onrender.com");
  assert.equal(r(base), "https://x.com");
});

test("the deployed backend fallback is a real, current Render address", () => {
  // Guards against a typo silently pointing every static visitor at nothing.
  const w = runInBrowser({ hostname: "alleq2th.github.io", origin: "https://alleq2th.github.io" });
  const base = w.ariaApiBase();
  assert.match(base, /^https:\/\/creatorpulse(-[a-z0-9]+)?\.onrender\.com$/);
  assert.doesNotMatch(
    base,
    /creatorpulse\.onrender\.com$/,
    "the retired bare 'creatorpulse.onrender.com' name answers 503 and must never be the fallback"
  );
});

test("index.html loads apiBase.js BEFORE anything that makes API calls", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const base = html.indexOf("lib/apiBase.js");
  assert.notEqual(base, -1, "index.html must include lib/apiBase.js");
  for (const later of ["core.js", "studio.js", "app.js"]) {
    const at = html.indexOf(`src="${later}`);
    assert.notEqual(at, -1, `index.html should still load ${later}`);
    assert.ok(base < at, `apiBase.js must load before ${later}`);
  }
});

test("index.html has no leading-slash asset paths that break a project-page URL", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const bad = html.match(/(?:src|href)="\/(?!\/)/g) || [];
  assert.equal(bad.length, 0, `found leading-slash paths: ${bad.join(", ")}`);
});
