/* CreatorPulse — Plus AI · api.js
 * Every server call Plus AI makes, in one place.
 *
 * THE BUG THIS FILE FIXES
 * -----------------------
 * The stat-card button used to send its request to /api/pulse-ai — the CHAT
 * endpoint — which only ever returns text. Tapping "Stat Cards & Posts" or
 * "Instagram Post" produced a wall of text and no image, every time.
 *
 * The stat-card engine (POST /api/pulse-ai/stat-card) was built, tested and
 * live the whole time; nothing was calling it. statCard() below calls it
 * directly, so the button now produces the actual rendered slide images.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});
  var api = (PA.api = {});

  function parse(r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok) {
        var e = new Error((j && j.error) || ("HTTP " + r.status));
        e.status = r.status;
        throw e;
      }
      return j;
    });
  }

  function post(path, body) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    }).then(parse);
  }
  function get(path) { return fetch(path).then(parse); }

  PA.post = post;
  PA.get = get;

  // Chat / brainstorm / cards / scripts / hooks / news / 7-day plan — text engine.
  api.chat = function (payload) { return post("/api/pulse-ai", payload); };

  // THE FIX — the real stat-card engine, returns { images:[...], slides:[...] }.
  api.statCard = function (opts) {
    opts = opts || {};
    return post("/api/pulse-ai/stat-card", {
      topic: opts.topic || "Trending Topic",
      format: opts.format || "instagram",
      palette: opts.palette || "noir_orange",
      category: opts.category,
      imageUrl: opts.imageUrl,
      niche: opts.niche
    });
  };

  api.liveNews = function (q, niche) {
    return get("/api/pulse-ai/live-news?q=" + encodeURIComponent(q || "sports ESPN") +
      (niche ? "&niche=" + encodeURIComponent(niche) : ""));
  };

  api.memoryGet = function () { return get("/api/pulse-ai/memory"); };
  api.memoryPost = function (rule) { return post("/api/pulse-ai/memory", { rule: rule }); };
  api.memoryDelete = function () {
    return fetch("/api/pulse-ai/memory", { method: "DELETE" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  };

  // Calendar write used by "Save script" / "Save card".
  api.schedulePost = function (body) { return post("/api/user-schedule", body); };
})();
