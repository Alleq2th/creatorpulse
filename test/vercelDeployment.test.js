const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

test("vercel.json is valid and configures express serverless routing", () => {
  const vercelPath = path.join(ROOT, "vercel.json");
  assert.ok(fs.existsSync(vercelPath), "vercel.json must exist in repository root");
  
  const content = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
  assert.equal(content.version, 2, "vercel.json must use platform version 2");
  assert.ok(Array.isArray(content.builds), "vercel.json must define builds array");
  
  const serverBuild = content.builds.find((b) => b.src === "server.js");
  assert.ok(serverBuild, "server.js must be configured as a build source");
  assert.equal(serverBuild.use, "@vercel/node", "server.js build must use @vercel/node");
  
  assert.ok(Array.isArray(content.routes), "vercel.json must define routes");
  const catchAll = content.routes.find((r) => r.dest === "/server.js");
  assert.ok(catchAll, "a route must redirect to /server.js");
});

test("server.js exports express app for vercel serverless runtime", () => {
  const serverSource = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
  assert.match(
    serverSource,
    /module\.exports\s*=\s*app;/,
    "server.js must export the express app via module.exports"
  );
  assert.match(
    serverSource,
    /if\s*\(\s*require\.main\s*===\s*module\s*\|\|\s*!process\.env\.VERCEL\s*\)/,
    "server.js must guard app.listen so it doesn't collide with Vercel serverless runtime"
  );
});
