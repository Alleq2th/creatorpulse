const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, "public", ...p), "utf8");

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
    keys: () => [...store.keys()],
  };
}

// Load the new state.js (which owns thread storage) once in a sandbox. The
// sandbox is returned whole so a test can both save and reload with the SAME
// in-memory image cache, which is what a real session does.
function loadState(storage) {
  const sandbox = { console, JSON, Date, Math, Object, Array, String, Number, Boolean, localStorage: storage };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("plus-ai", "state.js"), sandbox);
  return sandbox;
}

function runSave(threads, messages, storage) {
  const box = loadState(storage);
  const S = { pulseAi: { threads, activeThreadId: threads[0] && threads[0].id, messages } };
  box.window.CPPlusAI.saveThreads(S);
  return { S, box };
}

// A stat-card slide is a multi-megabyte base64 data URL. One real card is
// ~9.5MB, which is over the ~5MB localStorage quota - the exact bug that
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
function threadsWith(msg) {
  return [{ id: "t1", title: "B", createdAt: 1, updatedAt: 1, messages: [msg] }];
}

test("saveThreads does not throw when a stat card exceeds the quota", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = threadsWith(bigStatCardMessage("m1"));
  assert.doesNotThrow(() => runSave(threads, threads[0].messages, storage));
});

test("saveThreads strips base64 slide images from what it stores", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = threadsWith(bigStatCardMessage("m1"));
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

test("saveThreads keeps the in-memory images intact (memory cache)", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = threadsWith(bigStatCardMessage("m1"));
  const { S } = runSave(threads, threads[0].messages, storage);
  assert.equal(S.pulseAi.threads[0].messages[0].statCard.images.length, 4, "in-memory images must be untouched");
});

test("saveThreads prunes oldest threads and still saves when storage is nearly full", () => {
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

test("an image stripped from storage is rehydrated from the memory cache", () => {
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = threadsWith(bigStatCardMessage("m1"));

  // SAVE and RELOAD in the SAME sandbox, so the in-memory cache survives -
  // exactly what happens when the sheet reopens without a page refresh.
  const box = loadState(storage);
  box.window.CPPlusAI.saveThreads({ pulseAi: { threads, activeThreadId: "t1", messages: threads[0].messages } });
  const stored = JSON.parse(storage.getItem("cp_plus_ai_threads"));

  const S2 = { pulseAi: { threads: stored, activeThreadId: "t1", messages: [] } };
  box.window.CPPlusAI.loadThreadsSync(S2);
  const m = S2.pulseAi.messages[0];
  assert.ok(m.statCard.images.length === 4, "images must come back from the in-memory cache");
});

test("a stat-card message never sends a multi-megabyte string to storage", () => {
  // The regression guard: the ORIGINAL bug was a ~9.5MB localStorage write.
  const storage = makeStorage(5 * 1024 * 1024);
  const threads = threadsWith(bigStatCardMessage("m1"));
  runSave(threads, threads[0].messages, storage);
  storage.keys().forEach((k) => {
    const v = storage.getItem(k) || "";
    assert.ok(v.length < 200_000, `key "${k}" must not hold a giant payload (got ${v.length})`);
  });
});
