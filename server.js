// MINIMAL TEST SERVER — same security setup as the real app, nothing else.
const express = require("express");
const path = require("path");
const helmet = require("helmet");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR, { maxAge: 0, etag: true, index: false }));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html"), { headers: { "Cache-Control": "no-cache" } }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("MINITEST server running on port " + PORT));
