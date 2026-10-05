/* CreatorPulse - where is the brain?
 *
 * THE PROBLEM THIS FILE SOLVES
 * ---------------------------
 * CreatorPulse is two halves:
 *   - the FACE  : the screens (index.html, core.js, studio.js, app.js)
 *   - the BRAIN : the Express server (server.js) that fetches photos, makes
 *                 captions, reads news, and talks to Supabase.
 *
 * Every call in the app was written as `fetch(API + path)` with
 * `const API = window.location.origin` - i.e. "ask whatever machine served me
 * this page". That is correct when the Express server serves the page.
 *
 * But the app is ALSO published as a static site on GitHub Pages, which can
 * only hand out files - it cannot run a server. On that address every single
 * `/api/...` call asked GitHub Pages, which answers 404. Nothing ever reached
 * the real backend, which is exactly why Unsplash logged ZERO requests, why
 * captions answered 503, and why photos were blank.
 *
 * This file resolves one base address for the backend and routes every
 * same-origin `/api/` call to it. It is loaded BEFORE the other scripts.
 *
 * Resolution order (first one that applies wins):
 *   1. window.ARIA_API_BASE_URL            (explicit override, if ever needed)
 *   2. <meta name="aria-api-base">         (explicit override in index.html)
 *   3. localStorage.cp_api_base            (learned/remembered)
 *   4. a base we previously PROVED works    (localStorage.cp_api_base_ok)
 *   5. Static hosting (github.io, ...)  ->  the deploy backend below
 *   6. localhost / served by our Express->  same origin
 *   7. anything else                       ->  same origin
 *
 * Step 4 plus ariaLearnBase() means the app figures out the right answer on
 * its own and remembers it, instead of being permanently wrong on the
 * static-only address.
 */
(function () {
  "use strict";

  // The deployed backend. Change this ONE line if the Render service is ever
  // renamed, or set API_BASE_URL on Render / window.ARIA_API_BASE_URL instead.
  var DEFAULT_BACKEND = "https://creatorpulse.onrender.com";

  var LS_BASE = "cp_api_base";          // explicit, user/ops chosen
  var LS_LEARNED = "cp_api_base_ok";    // proven to answer /api/health
  var HEALTH_PATH = "/api/health";

  function readLS(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  // Accept "host", "host/path" or a full URL; drop trailing slashes so
  // `base + "/api/x"` never produces a double slash.
  function normalize(u) {
    if (!u) return "";
    var s = String(u).trim().replace(/\/+$/, "");
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
    return s;
  }

  function explicitBase() {
    var w = "";
    try { w = window.ARIA_API_BASE_URL || ""; } catch (e) {}
    var meta = "";
    try {
      var m = document.querySelector('meta[name="aria-api-base"]');
      meta = m ? (m.getAttribute("content") || "") : "";
    } catch (e) {}
    return normalize(w || meta || readLS(LS_BASE));
  }

  function isLocalHost() {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(location.hostname);
  }

  // Static-only hosts cannot answer /api/ no matter what.
  function isStaticHost() {
    return /(^|\.)(github\.io|gitlab\.io|netlify\.app|vercel\.app|pages\.dev|surge\.sh|web\.app)$/i.test(location.hostname);
  }

  // Pure rule table - kept free of I/O so it can be unit-tested directly.
  function resolveStatic(input) {
    input = input || {};
    if (input.explicit) return input.explicit;
    if (input.learnedOk) return input.learnedOk;
    if (input.protocol === "file:") return "";
    if (input.isLocal) return input.origin;
    if (input.isStaticHost) return input.defaultBackend;
    return input.origin;
  }

  function resolve() {
    return resolveStatic({
      explicit: explicitBase(),
      learnedOk: normalize(readLS(LS_LEARNED)),
      protocol: location.protocol,
      isLocal: isLocalHost(),
      isStaticHost: isStaticHost(),
      origin: location.origin,
      defaultBackend: DEFAULT_BACKEND,
    });
  }

  // Cache so a busy page never recomputes (or re-probes) per call.
  var cachedBase = null;
  function apiBase() {
    if (cachedBase === null) cachedBase = resolve();
    return cachedBase;
  }

  // "Do I need to rewrite this URL?" A relative path like `/api/news` and an
  // absolute same-origin URL like `https://me.github.io/api/news` both count.
  function isApiRequest(url) {
    try {
      var u = new URL(String(url), location.href);
      return u.pathname.indexOf("/api/") === 0 && u.origin === location.origin;
    } catch (e) { return false; }
  }

  function targetFor(url) {
    var base = apiBase();
    if (!base) return String(url);            // same origin IS the backend
    var u = new URL(String(url), location.href);
    return base + u.pathname + u.search;
  }

  // ── the one hook that fixes every call site ───────────────────────────────
  // core.js, app.js and studio.js all build their own fetch calls. Rather than
  // edit each one (and miss a future one), redirect at the single choke point.
  // Untouched: any URL that is not a same-origin `/api/` request.
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;

  function ariaFetch(input, init) {
    if (!nativeFetch) return Promise.reject(new Error("fetch is unavailable"));
    var url = (typeof input === "string") ? input : (input && input.url) || "";

    if (!isApiRequest(url) || !apiBase()) {
      return nativeFetch(input, init);
    }

    var primary = targetFor(url);
    var fallback; // the original same-origin URL, tried only if `primary` 404s
    try { fallback = new URL(String(url), location.href).href; } catch (e) { fallback = null; }

    return nativeFetch(primary, init).then(function (r) {
      // A 404/405 means this host is not the brain after all - quietly try the
      // address the page came from, so a repo rename can never hard-break it.
      if ((r.status === 404 || r.status === 405) && fallback && fallback !== primary) {
        return nativeFetch(fallback, init);
      }
      if (r.ok) {
        writeLS(LS_LEARNED, apiBase());
      }
      return r;
    }, function (err) {
      if (fallback && fallback !== primary) return nativeFetch(fallback, init);
      throw err;
    });
  }

  if (nativeFetch) window.fetch = ariaFetch;

  // ── probing + wake-up reporting ──────────────────────────────────────────
  // Render's free tier sleeps after ~15 min idle and takes ~1 min to wake.
  // Rather than leave a blank screen, ask /api/health and describe what is
  // happening in plain words.
  function ariaHealth(timeoutMs) {
    var base = apiBase() || location.origin;
    var url = base + HEALTH_PATH;
    var ctl = (typeof AbortController === "function") ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 90000) : null;
    return (nativeFetch || fetch)(url, ctl ? { signal: ctl.signal, cache: "no-store" } : { cache: "no-store" })
      .then(function (r) {
        if (timer) clearTimeout(timer);
        if (!r.ok) return { ok: false, status: r.status, base: base };
        writeLS(LS_LEARNED, base);
        return r.json().then(function (j) { return { ok: !!j.ok, status: r.status, base: base, integrations: j.integrations || {} }; });
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        return { ok: false, status: 0, base: base, error: (e && e.name === "AbortError") ? "timeout" : (e && e.message) || "network" };
      });
  }

  // Deliberately NOT awaited at load: it never blocks the app from painting.
  function ariaLearnBase() {
    return ariaHealth(90000).then(function (h) {
      if (h && h.ok) { cachedBase = h.base; writeLS(LS_LEARNED, h.base); }
      return h;
    });
  }

  window.ariaApiBase = apiBase;
  window.ariaFetch = ariaFetch;
  window.ariaHealth = ariaHealth;
  window.ariaLearnBase = ariaLearnBase;
  window.__ariaResolveStatic = resolveStatic; // exposed for tests only
})();
