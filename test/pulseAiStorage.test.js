const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const CORE_JS = fs.readFileSync(path.join(ROOT, "public", "core.js"), "utf8");

// Pull just the savePulseAiThreads function out of core.js so it can be run
// against a fake localStorage without booting the whole browser app.
function extractSaveFn() {
  const start = CORE_JS.indexOf("window.savePulseAiThreads");
  assert.ok(start !== -1, "core.js must define window.savePulseAiThreads");
  const end = CORE_JS.indexOf("\n};", start);
  assert.ok(end !== -1, "savePulseAiThreads must be a complete function");
  return CORE_JS.slice(start, end + 3);
}

// A localStorage stand-in that enforces a real byte quota, like a browser does.
function makeStorage(quotaBytes) {
  const store = new Map();
  const used = () => [...store.values()].reduce((n, v) => n + v.length, 0);
  return {
    _store: store,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      const next = used() - (store.get(k) || "").length + v.length;
      if (next > quotaBytes) {
        const err = new Error("quota exceeded");
        err.name = "QuotaExceededError";
        throw err;
      }
      store.set(k, v);
    },
    removeItem: (k) => store.delete(k),
  };
}

function runSave(threads, messages, storage) {
  const S = { pulseAi: { threads, activeThreadId: threads[0] && threads[0].id, messages } };
  const sandbox = { S, localStorage: storage, Date, JSON, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(extractSaveFn() + "\nwindow.savePulseAiThreads();", sandbox);
  return S;
}

// A stat-card slide is a multi-megabyte base64 data URL. One real card is
// ~9.5MB, which is over the ~5MB localStorage quota — the exact bug that
// froze the app. These tests fail if that payload is ever persisted again.
function bigStatCardMessage(id) {
  const img = "data:image/png;base64," + "A".repeat(2_500_000);
  return {
    id,
    role: "assistant",
    content: "Here are your cards",
    action: "stat_card",
    statCard: { images: [img, img, img, img], slides: [img, img, img, img], topic: "Basketball", format: "instagram" },
  };
}

test("savePulseAiThreads does not throw when a stat card exceeds the quota", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = [{ id: "t1", title: "B", createdAt: 1, updatedAt: 1, messages: [bigStatCardMessage("m1")] }];
  assert.doesNotThrow(() => runSave(threads, threads[0].messages, storage));
});

test("savePulseAiThreads strips base64 slide images from what it stores", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = [{ id: "t1", title: "B", createdAt: 1, updatedAt: 1, messages: [bigStatCardMessage("m1")] }];
  runSave(threads, threads[0].messages, storage);

  const stored = storage.getItem("cp_plus_ai_threads");
  assert.ok(stored, "threads must still be persisted");
  assert.ok(stored.length < 100_000, `stored payload must be small, got ${stored.length} bytes`);

  const parsed = JSON.parse(stored);
  const card = parsed[0].messages[0].statCard;
  assert.deepEqual(card.images, [], "images must not be persisted");
  assert.deepEqual(card.slides, [], "slides must not be persisted");
  assert.equal(card.topic, "Basketball", "the rest of the stat card must survive");
});

test("savePulseAiThreads keeps the in-memory images intact", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = [{ id: "t1", title: "B", createdAt: 1, updatedAt: 1, messages: [bigStatCardMessage("m1")] }];
  const S = runSave(threads, threads[0].messages, storage);
  assert.equal(S.pulseAi.threads[0].messages[0].statCard.images.length, 4, "in-memory images must be untouched");
});

test("savePulseAiThreads prunes oldest threads and still saves when storage is nearly full", () => {
  const storage = makeStorage(60_000);
  storage.setItem("filler", "x".repeat(50_000));
  const threads = Array.from({ length: 5 }, (_, i) => ({
    id: "t" + i, title: "T" + i, createdAt: i, updatedAt: i,
    messages: [{ id: "m" + i, role: "assistant", content: "y".repeat(5_000), action: "chat" }],
  }));
  assert.doesNotThrow(() => runSave(threads, threads[0].messages, storage));
  const stored = storage.getItem("cp_plus_ai_threads");
  assert.ok(stored, "at least one thread must be saved");
  assert.ok(JSON.parse(stored).length < 5, "oldest threads must be pruned to fit");
});
