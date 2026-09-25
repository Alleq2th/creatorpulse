// Boot smoke test: server.js must actually load and answer a request.
//
// Why this test exists: the app once shipped a commit where server.js
// destructured nine names off config/feeds while that module exported five --
// two of the names were also declared in server.js itself, so Node refused to
// load the file at all:
//
//     SyntaxError: Identifier 'NICHE_QUERIES' has already been declared
//
// The server died before a single route was mounted. The unit tests stayed
// green through all of it, because each route module still imported fine on its
// own. Nothing in the suite ever asked "does the app actually start?".
//
// This does. It spawns the real server on a scratch port with no env vars set
// (the app is designed to boot without any) and asserts that /api/health
// answers 200 with ok:true. A syntax error, a bad require, a duplicate
// declaration, or a crash during startup all fail here.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PORT = 3987; // scratch port, well away from 3000/8080

function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(`http://127.0.0.1:${PORT}/api/health`)
        .then((r) => r.json())
        .then(resolve)
        .catch((err) => {
          if (Date.now() > deadline) return reject(err);
          setTimeout(attempt, 250);
        });
    };
    attempt();
  });
}

test("server.js boots and /api/health answers ok:true", { timeout: 30000 }, async () => {
  const proc = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  let exited = null;
  proc.stderr.on("data", (d) => { stderr += d.toString(); });
  proc.stdout.on("data", () => {});
  proc.on("exit", (code) => { exited = code; });

  try {
    const health = await waitForHealth(15000);
    assert.equal(health.ok, true, "health endpoint should report ok:true");
    assert.equal(typeof health.integrations, "object", "health should report integration status");
    // These must be booleans. A secret value leaking here would be a real
    // security bug, and this is the cheapest place to catch it.
    for (const [name, val] of Object.entries(health.integrations)) {
      assert.equal(typeof val, "boolean", `integrations.${name} must be a boolean, not a value`);
    }
  } catch (err) {
    throw new Error(
      `server.js did not come up on port ${PORT}. ` +
      (exited !== null ? `Process exited with code ${exited}. ` : "") +
      (stderr ? `stderr:\n${stderr.slice(0, 2000)}` : "(no stderr)") +
      `\nOriginal error: ${err.message}`
    );
  } finally {
    proc.kill("SIGTERM");
  }
});

test("server.js passes node's own syntax check", { timeout: 20000 }, async () => {
  const { spawnSync } = require("node:child_process");
  const r = spawnSync(process.execPath, ["--check", "server.js"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `node --check server.js failed:\n${r.stderr}`);
});
