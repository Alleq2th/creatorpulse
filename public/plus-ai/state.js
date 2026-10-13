/* CreatorPulse — Plus AI · state.js
 * Conversation threads, creator memory, and storage that can never wedge the app.
 *
 * Three rules this file exists to enforce:
 *   1. A storage failure always degrades — it NEVER throws into render().
 *   2. Base64 slide images are NEVER written to localStorage. One stat card is
 *      ~9.5MB and localStorage caps at ~5MB, so a write of that blew the quota
 *      (QuotaExceededError) and left the app unable to save anything at all.
 *      Images now live in an in-memory cache only; storage keeps a stripped copy.
 *   3. Opening the sheet never does heavy work before the first paint.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});

  var THREADS_KEY = "cp_plus_ai_threads";
  var LEGACY_KEY  = "cp_pulse_ai_messages";
  var MEMORY_KEY  = "cp_pulse_ai_memory";

  // Images that must never touch storage, keyed by message id. Memory only.
  var imageCache = {};
  PA.imageCache = imageCache;

  function blank() {
    return {
      open: false, messages: [], loading: false, hydrating: false,
      platform: "tiktok", goal: "views", niche: "", brandVoice: "", input: "",
      showMemory: false, showThreads: false, memory: null,
      threads: [], activeThreadId: null, attachment: null
    };
  }
  PA.blankState = blank;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function safeDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  PA.safeGet = safeGet; PA.safeSet = safeSet; PA.safeDel = safeDel;

  // Remove anything heavy before a message is written to storage.
  function stripHeavy(msg) {
    if (!msg || !msg.statCard) return msg;
    var sc = msg.statCard;
    if (sc.images && sc.images.length) imageCache[msg.id] = sc.images; // keep in memory
    var copy = {};
    for (var k in sc) { if (k !== "images" && k !== "slides") copy[k] = sc[k]; }
    copy.images = [];
    copy.slides = [];
    copy._stripped = true;
    return {
      id: msg.id, role: msg.role, content: msg.content, timestamp: msg.timestamp,
      action: msg.action, model: msg.model, statCard: copy
    };
  }
  PA.stripHeavy = stripHeavy;

  // Re-attach in-memory images so a stripped thread still shows its slides.
  function rehydrate(msgs) {
    return (msgs || []).map(function (m) {
      if (m && m.statCard && (!m.statCard.images || !m.statCard.images.length) && imageCache[m.id]) {
        var copy = {};
        for (var k in m.statCard) copy[k] = m.statCard[k];
        copy.images = imageCache[m.id];
        return {
          id: m.id, role: m.role, content: m.content, timestamp: m.timestamp,
          action: m.action, model: m.model, statCard: copy
        };
      }
      return m;
    });
  }
  PA.rehydrate = rehydrate;

  // Cheap, never-throwing parse of stored threads. Stored data is already
  // image-stripped, so this stays small and fast even after long use.
  PA.loadThreadsSync = function (S) {
    if (!S.pulseAi) S.pulseAi = blank();
    var threads = [];
    try {
      var raw = safeGet(THREADS_KEY);
      if (raw) { var parsed = JSON.parse(raw); if (Array.isArray(parsed)) threads = parsed; }
    } catch (e) { threads = []; }

    if (!threads.length) {
      var legacy = [];
      try { var l = safeGet(LEGACY_KEY); if (l) legacy = JSON.parse(l) || []; } catch (e) { legacy = []; }
      if (!Array.isArray(legacy)) legacy = [];
      threads = [{
        id: "thread_" + Date.now(),
        title: (legacy[0] && legacy[0].content) ? String(legacy[0].content).slice(0, 32).trim() + "..." : "Creative Session",
        createdAt: Date.now(), updatedAt: Date.now(), messages: legacy
      }];
    }
    S.pulseAi.threads = threads;
    if (!S.pulseAi.activeThreadId || !threads.some(function (t) { return t.id === S.pulseAi.activeThreadId; })) {
      S.pulseAi.activeThreadId = threads[0].id;
    }
    var active = threads.filter(function (t) { return t.id === S.pulseAi.activeThreadId; })[0];
    S.pulseAi.messages = rehydrate(active ? active.messages : []);
  };

  // Persist threads: strip heavy fields, then prune oldest on quota pressure so
  // a save never throws and never leaves the app unable to store anything.
  PA.saveThreads = function (S) {
    if (!S || !S.pulseAi || !S.pulseAi.threads) return;
    try {
      var active = S.pulseAi.threads.filter(function (t) { return t.id === S.pulseAi.activeThreadId; })[0];
      if (active) {
        active.messages = S.pulseAi.messages || [];
        active.updatedAt = Date.now();
        if ((!active.title || active.title === "New Conversation" || active.title === "Creative Session") && active.messages.length) {
          var first = null;
          for (var i = 0; i < active.messages.length; i++) {
            if (active.messages[i].role === "user") { first = active.messages[i]; break; }
          }
          if (first && first.content) {
            active.title = String(first.content).replace(/[#*`]/g, "").slice(0, 32).trim() + "...";
          }
        }
      }
      var build = function (list) {
        return list.map(function (t) {
          return {
            id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt,
            messages: (t.messages || []).map(stripHeavy)
          };
        });
      };
      var list = S.pulseAi.threads.slice(0, 25); // only the newest
      for (;;) {
        if (safeSet(THREADS_KEY, JSON.stringify(build(list)))) break;
        if (list.length > 1) { list = list.slice(0, -1); continue; }
        safeDel(THREADS_KEY);
        break;
      }
      // Compact mirror of the last few messages (also stripped).
      var tail = (S.pulseAi.messages || []).slice(-30).map(stripHeavy);
      if (!safeSet(LEGACY_KEY, JSON.stringify(tail))) safeDel(LEGACY_KEY);
    } catch (e) { /* storage must never break the app */ }
  };

  PA.loadMemoryCache = function (S) {
    try {
      var c = safeGet(MEMORY_KEY);
      if (c) { if (!S.pulseAi) S.pulseAi = blank(); S.pulseAi.memory = JSON.parse(c); }
    } catch (e) {}
  };
  PA.saveMemoryCache = function (S) {
    try { if (S && S.pulseAi && S.pulseAi.memory) safeSet(MEMORY_KEY, JSON.stringify(S.pulseAi.memory)); } catch (e) {}
  };

  PA.clearAll = function () {
    safeDel(THREADS_KEY); safeDel(LEGACY_KEY);
    imageCache = {}; PA.imageCache = imageCache;
  };
})();
