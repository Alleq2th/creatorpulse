/* CreatorPulse — Plus AI · index.js  (entry / wiring)
 *
 * Loaded AFTER core.js and app.js. It owns the small set of globals the rest
 * of the app calls, and nothing here does heavy work during page load.
 *
 * WHAT CHANGED IN THIS REBUILD
 *  - Split into state / api / ui / cards / actions. No single giant file.
 *  - Opening the sheet paints FIRST and loads history lazily, so a large saved
 *    conversation can never block the open.
 *  - The stat-card button now calls /api/pulse-ai/stat-card (the real engine)
 *    instead of the text-only chat endpoint.
 *  - The photo button actually reads the image (downscaled), not just a name.
 *  - Base64 slide images never enter localStorage; storage stays small.
 *  - Every render path is wrapped, so one bad message degrades to text instead
 *    of blanking the page and wedging every later tap.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});
  // `const S` in core.js is reachable as a bare global lexical name from this
  // later script, but is NOT a property of window. Fall back to window.S too.
  var S_ = function () { return (typeof S !== "undefined" ? S : null) || window.S; };
  function ensure(s) { if (s && !s.pulseAi) s.pulseAi = PA.blankState(); if (!s.pulseAi) s.pulseAi = PA.blankState(); return s.pulseAi; }
  function toast(m) { try { if (typeof window.toast === "function") window.toast(m); } catch (e) {} }

  // ── Open: paint now, hydrate after ──────────────────────────────────────
  window.openPulseAi = function (initialPrompt, initialAction) {
    try {
      var s = S_();
      if (!s) return;
      var P = ensure(s);

      // History is already in memory when the app is running; the ONLY work
      // done here is a cheap, never-throwing sync load. No fetch blocks paint.
      if (!P.threads || !P.threads.length) PA.loadThreadsSync(s);
      PA.loadMemoryCache(s);

      P.open = true;
      P.showMemory = false;
      P.showThreads = false;
      s.coachOpen = true;
      if (!P.niche && s.user && s.user.niches && s.user.niches[0]) P.niche = s.user.niches[0];
      if (!P.platform && (s.coachPlatform || (s.user && s.user.primaryPlatform))) {
        P.platform = s.coachPlatform || s.user.primaryPlatform || "tiktok";
      }

      PA.ui.repaint();
      PA.ui.scrollToBottom();

      // Refresh memory in the background; it repaints when it lands.
      PA.api.memoryGet().then(function (res) {
        if (res && res.memory) { P.memory = res.memory; PA.saveMemoryCache(s); PA.ui.repaint(); }
      }).catch(function () {});

      if (initialPrompt) {
        window.sendPulseAiMessage(initialPrompt, initialAction);
      } else {
        setTimeout(function () { var el = document.getElementById("pulse-input"); if (el) el.focus(); }, 120);
      }
    } catch (e) {
      try { console.warn("openPulseAi failed:", e && e.message); } catch (_) {}
      try { var ov = document.querySelector(".sheet-overlay"); if (ov && ov.parentNode) ov.parentNode.removeChild(ov); } catch (_) {}
    }
  };

  window.closePulseAi = function () { PA.ui.close(); };
  window.resetPulseAiConversation = function () { window.newPulseAiThread(); };
  window.scrollPulseAiToBottom = function () { PA.ui.scrollToBottom(); };

  // ── Send ────────────────────────────────────────────────────────────────
  window.sendPulseAiMessage = function (customText, actionType) {
    var s = S_();
    if (!s) return;
    var P = ensure(s);
    P.showMemory = false;
    P.showThreads = false;

    var inputEl = document.getElementById("pulse-input");
    var text = (customText !== undefined ? customText : (inputEl ? inputEl.value : (P.input || ""))).trim();
    if (!text) return;

    // A stat-card request is routed to the real stat-card engine, not chat.
    var isStatCard = actionType === "stat_card" || actionType === "tiktok_post";
    if (isStatCard) {
      if (inputEl) { inputEl.value = ""; inputEl.style.height = "auto"; }
      P.input = "";
      if (inputEl === null) { /* keep going */ }
      var topic = PA.cards.extractTopic(text);
      var fmt = actionType === "tiktok_post" ? "tiktok" : (/tiktok/i.test(text) ? "tiktok" : "instagram");
      return PA.actions.runStatCard(topic, fmt);
    }

    if (inputEl) { inputEl.value = ""; inputEl.style.height = "auto"; }
    P.input = "";

    var caption = "";
    if (P.attachment && P.attachment.dataUrl) {
      caption = "[Attached photo: " + (P.attachment.name || "image") + " " + P.attachment.w + "x" + P.attachment.h + "]";
    }

    var userMsg = {
      id: PA.rid("msg"), role: "user", content: text + (caption ? "\n" + caption : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action: actionType || "chat",
      attachment: P.attachment || null
    };
    P.attachment = null;

    P.messages.push(userMsg);
    P.loading = true;
    s.coachLoading = true;
    try { if (s.errors) { delete s.errors.pulseAi; delete s.errors.coach; } } catch (e) {}
    PA.saveThreads(s);
    PA.ui.repaint();
    PA.ui.scrollToBottom();

    var conns = Object.keys(s.connections || {}).map(function (k) {
      var v = s.connections[k] || {}; return k + ": " + (v.handle || "(connected)");
    }).join(", ");
    var savedRecent = (s.saved || []).slice(0, 6).map(function (p) {
      return p.content_type + " on " + p.platform + " for " + p.niche + ": " + p.headline;
    }).join("\n");

    var payload = {
      messages: P.messages.map(function (m) { return { role: m.role, content: m.content }; }),
      action: actionType || "chat",
      context: {
        handle: s.coachHandle || (s.user && (s.user.handle || s.user.name)) || "creator",
        platform: P.platform || s.coachPlatform || "tiktok",
        niche: P.niche || (s.user && s.user.niches && s.user.niches[0]) || "general",
        goal: P.goal || "views",
        brandVoice: P.brandVoice || "",
        recentMetrics: s.coachMetrics || "",
        recentPosts: savedRecent || "",
        connections: conns || ""
      }
    };

    PA.api.chat(payload).then(function (d) {
      if (d.error) throw new Error(d.error);
      if (d.memory) { P.memory = d.memory; PA.saveMemoryCache(s); }
      var assistantMsg = {
        id: PA.rid("msg"), role: "assistant",
        content: d.text || d.answer || "I am ready with your creative angle. Let's make it hit.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: d.action || actionType || "chat",
        model: d.model || "pulse-ai",
        statCard: d.statCard || null
      };
      P.messages.push(assistantMsg);
      s.coachAnswer = assistantMsg.content;
      PA.saveThreads(s);
    }).catch(function () {
      try {
        s.errors.pulseAi = "Plus AI is temporarily unavailable. Check your connection or try again.";
        s.errors.coach = s.errors.pulseAi;
      } catch (e) {}
      toast("Plus AI error — try again");
    }).then(function () {
      P.loading = false;
      s.coachLoading = false;
      PA.ui.repaint();
      PA.ui.scrollToBottom();
    });
  };

  // ── Globals the inline markup and older code call ───────────────────────
  window.savePulseAiThreads = function () { PA.saveThreads(S_()); };
  window.loadPulseAiThreads = function () { PA.loadThreadsSync(S_()); };
  window.loadPulseAiMemory = function () {
    var s = S_(); if (!s) return;
    PA.loadMemoryCache(s);
    PA.api.memoryGet().then(function (res) {
      if (res && res.memory) { ensure(s).memory = res.memory; PA.saveMemoryCache(s); PA.ui.repaint(); }
    }).catch(function () {});
  };

  window.newPulseAiThread = function () { PA.actions.newThread(); };
  window.switchPulseAiThread = function (id) { PA.actions.switchThread(id); };
  window.deletePulseAiThread = function (id, e) { PA.actions.deleteThread(id, e); };
  window.togglePulseAiThreads = function (e) { PA.actions.toggleThreads(e); };
  window.togglePulseAiMemory = function (e) { PA.actions.toggleMemory(e); };
  window.addPulseAiCustomRule = function () { PA.actions.addCustomRule(); };
  window.resetPulseAiMemory = function () { PA.actions.resetMemory(); };

  window.generatePulseStatCard = function (topic, format) { PA.actions.runStatCard(topic, format); };
  window.downloadPulseSlide = function (id, i) { PA.actions.downloadSlide(id, i); };
  window.downloadPulseAllSlides = function (id) { PA.actions.downloadAllSlides(id); };
  window.switchStatCardFormat = function (id, f) { PA.actions.switchStatCardFormat(id, f); };
  window.savePulseStatCardToLibrary = function (id) { PA.actions.saveStatCardToLibrary(id); };

  window.saveContentCard = function (t, h, f, a) { PA.actions.saveContentCard(t, h, f, a); };
  window.pulseAiSaveScript = function (id) { PA.actions.saveScript(id); };
  window.pulseAiShootScript = function (id) { PA.actions.shootScript(id); };
  window.copyPulseAiMessage = function (id) {
    var m = PA.actions.findMsg(id);
    if (m && typeof window.copyTxt === "function") window.copyTxt(m.content);
  };

  window.plusAiAttachPhoto = function (input) { PA.actions.attachPhoto(input); };
  window.clearPulseAiPhoto = function () { PA.actions.clearPhoto(); };
  window.coachUploadScreenshot = function (e) { PA.actions.attachPhoto(e && e.target); }; // legacy alias
  window.runCoach = function () {
    var s = S_();
    window.openPulseAi(
      (s && s.coachMetrics) ? ("Analyze my performance with these metrics:\n" + s.coachMetrics)
                            : "Give me a weekly creator audit — what is working, what to fix, and 3 experiments to try.",
      "coach"
    );
  };

  // ── The markup hook core.js calls ───────────────────────────────────────
  window.renderFloatingCoach = function () {
    try { return PA.ui.floatingCoach(); }
    catch (e) {
      try { console.warn("Plus AI sheet render fallback:", e && e.message); } catch (_) {}
      return "";
    }
  };

  // Close on Escape, but never leave the backdrop behind if anything throws.
  try {
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      var s = S_();
      if (s && s.pulseAi && s.pulseAi.open) PA.ui.close();
    });
  } catch (e) {}
})();
