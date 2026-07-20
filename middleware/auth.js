// Security + performance middleware for CreatorPulse.
// helmet, express-rate-limit, and compression are REQUIRED â€” if any fail to
// load, the app crashes on startup rather than silently running unprotected.
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

function setupSecurity(app) {
  // Security headers (Helmet) with a CSP tuned for the inline SPA + external image CDNs
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "media-src": ["'self'", "blob:", "data:", "https:"],
        "connect-src": ["'self'", "https:"],
        "frame-ancestors": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // Gzip/brotli responses
  app.use(compression());

  // Extra hardening headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
    next();
  });
}

module.exports = { setupSecurity, rateLimit };
