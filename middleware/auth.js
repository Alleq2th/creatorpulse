// Security + performance middleware for CreatorPulse.
//
// This is the single source of truth for security headers. server.js imports
// it via setupSecurity(); server.js no longer keeps its own copy of the
// helmet/CSP/hardening-header block. Those two copies had already drifted, so
// whichever one a future change missed would silently win.
//
// helmet / express-rate-limit / compression are loaded defensively: if one is
// missing the app degrades and logs it, rather than crashing on boot or
// silently dropping a header.
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

// CSP tuned for the inline SPA + external image CDNs.
//
// worker-src / child-src matter for the Studio's export. ffmpeg.wasm boots its
// core inside a Web Worker, and its loader constructs that worker from a blob:
// URL. Without these the browser falls back to script-src, refuses the blob
// worker, and the loader fails with "failed to fetch dynamically imported
// module: blob:..." — which is exactly what the Studio export was hitting. It
// looked like a flaky engine load, so the real cause was this header.
const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", "https://apis.google.com"],
  "script-src-attr": ["'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "media-src": ["'self'", "blob:", "data:", "https:"],
  "connect-src": ["'self'", "https:", "blob:", "data:"],
  // The media encoder. 'self' for the vendored engine, blob: for the worker
  // and the wasm module it is handed, data: for the inlined core URL.
  "worker-src": ["'self'", "blob:"],
  "child-src": ["'self'", "blob:"],
  "frame-ancestors": ["'none'"],
};

// opts.compression lets the caller pass in the module it already resolved (or
// null when it is absent) so the two files agree on what is actually loaded.
function setupSecurity(app, opts = {}) {
  const compressionMw = opts.compression !== undefined ? opts.compression : compression;

  if (helmet) {
    app.use(helmet({
      contentSecurityPolicy: { useDefaults: true, directives: CSP_DIRECTIVES },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }));
  } else {
    console.warn("[security] helmet not installed - security headers are DISABLED");
  }

  if (compressionMw) app.use(compressionMw());
  else console.warn("[security] compression not installed - responses will not be compressed");

  // Extra hardening headers.
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
    next();
  });
}

module.exports = { setupSecurity, rateLimit, CSP_DIRECTIVES };
