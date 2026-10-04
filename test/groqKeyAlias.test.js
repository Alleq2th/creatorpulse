// Regression test: the Groq key must be picked up under ANY of its common
// spellings, not only GROQ_API_KEY.
//
// Why this test exists: the owner had a valid Groq key set on Render, but
// /api/transcribe still answered 503 "Transcription not configured." The code
// read exactly one name -- process.env.GROQ_API_KEY -- so a key stored as
// GROQ_KEY (or GROK_API_KEY, or WHISPER_API_KEY) was invisible to it. The
// server now accepts all four spellings and trims surrounding whitespace.
//
// This spawns the real server with ONLY the alias set and asserts that
// /api/health reports groq:true, which is the same condition the transcribe
// route checks before it will run.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function waitForHealth(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(`http://127.0.0.1:${port}/api/health`)
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

// Spawn the server with a clean env (no inherited GROQ_* names) plus the
// supplied overrides, and return the parsed /api/health body.
async function healthWith(port, overrides) {
  const env = { ...process.env, PORT: String(port), NODE_ENV: "test" };
  // Strip every spelling first so the test controls exactly which one is set.
  for (const k of ["GROQ_API_KEY", "GROQ_KEY", "GROK_API_KEY", "WHISPER_API_KEY"]) {
    delete env[k];
  }
  Object.assign(env, overrides);

  const proc = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  proc.stderr.on("data", (d) => { stderr += d.toString(); });
  proc.stdout.on("data", () => {});

  try {
    return await waitForHealth(port, 15000);
  } catch (err) {
    throw new Error(`server did not come up on ${port}. stderr:\n${stderr.slice(0, 1500)}\n${err.message}`);
  } finally {
    proc.kill("SIGTERM");
  }
}

test("GROQ_KEY (alias) is recognised as a configured Groq key", { timeout: 30000 }, async () => {
  const health = await healthWith(3991, { GROQ_KEY: "gsk_test_alias_key" });
  assert.equal(health.integrations.groq, true, "GROQ_KEY should count as configured");
});

test("GROK_API_KEY (common misspelling) is recognised", { timeout: 30000 }, async () => {
  const health = await healthWith(3992, { GROK_API_KEY: "gsk_test_misspelling" });
  assert.equal(health.integrations.groq, true, "GROK_API_KEY should count as configured");
});

test("WHISPER_API_KEY is recognised", { timeout: 30000 }, async () => {
  const health = await healthWith(3993, { WHISPER_API_KEY: "gsk_test_whisper" });
  assert.equal(health.integrations.groq, true, "WHISPER_API_KEY should count as configured");
});

test("a whitespace-only key does NOT count as configured", { timeout: 30000 }, async () => {
  const health = await healthWith(3994, { GROQ_API_KEY: "   \n  " });
  assert.equal(health.integrations.groq, false, "a blank key must not be treated as configured");
});

test("no key at all reports groq:false", { timeout: 30000 }, async () => {
  const health = await healthWith(3995, {});
  assert.equal(health.integrations.groq, false, "with no key, groq must be false");
});
