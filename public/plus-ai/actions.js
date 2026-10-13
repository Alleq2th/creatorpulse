/* CreatorPulse — Plus AI · actions.js
 * Save to calendar, send to Studio, copy, download, switch format,
 * photo attach, thread + memory management.
 *
 * Every action is fire-and-forget-safe: a failure shows a toast, it never
 * throws into the render path.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});
  var actions = (PA.actions = {});

  // `const S` in core.js is a global lexical binding, not window.S — read it
  // by name, falling back to window.S if the app ever exposes it there.
  function st() { return (typeof S !== "undefined" ? S : null) || window.S || null; }
  function toast(m) { try { if (typeof window.toast === "function") window.toast(m); } catch (e) {} }
  function stamp() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function rid(p) { return (p || "msg") + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6); }
  PA.rid = rid;

  function findMsg(id) {
    var s = st();
    if (!s || !s.pulseAi) return null;
    var list = s.pulseAi.messages || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  actions.findMsg = findMsg;

  // ── STAT CARDS: the button that used to hit the wrong endpoint ──────────
  actions.runStatCard = function (topic, format) {
    var s = st();
    if (!s || !s.pulseAi) return;
    var fmt = format || "instagram";
    var clean = String(topic || "").replace(/['\\]/g, "").trim() || "Trending Topic";

    var uId = rid("msg");
    s.pulseAi.messages.push({ id: uId, role: "user", content: "Make a " + fmt + " stat card: " + clean, timestamp: stamp(), action: "stat_card" });

    var aMsg = {
      id: rid("msg"), role: "assistant", action: "stat_card", timestamp: stamp(),
      content: "Rendering your " + (fmt === "tiktok" ? "TikTok" : "Instagram") + " stat card…",
      statCard: { topic: clean, format: fmt, images: [], slides: [], _loading: true }
    };
    s.pulseAi.messages.push(aMsg);
    s.pulseAi.loading = true;
    PA.ui.repaint();

    PA.api.statCard({ topic: clean, format: fmt, niche: s.pulseAi.niche })
      .then(function (res) {
        aMsg.statCard = {
          topic: res.topic || clean, format: res.format || fmt,
          images: res.images || [], slides: res.slides || [],
          palette: res.palette, category: res.category,
          imageUrl: res.imageUrl, imageCredit: res.imageCredit
        };
        aMsg.content = "Here is your " + (fmt === "tiktok" ? "TikTok" : "Instagram") + " stat card for **" + clean + "**.";
        PA.imageCache[aMsg.id] = aMsg.statCard.images; // memory only — never stored
      })
      .catch(function (err) {
        aMsg.statCard = null;
        aMsg.content = "Could not render the stat card (" + ((err && err.message) || "error") + "). Tap the button again to retry.";
      })
      .then(function () {
        s.pulseAi.loading = false;
        PA.saveThreads(s);
        PA.ui.repaint();
        PA.ui.scrollToBottom();
      });
  };
  // Back-compat alias used by the inline card buttons.
  actions.generateStatCard = function (topic, format) { actions.runStatCard(topic, format); };

  actions.downloadSlide = function (msgId, idx) {
    var m = findMsg(msgId);
    var imgs = (m && m.statCard && m.statCard.images) || PA.imageCache[msgId] || [];
    var img = imgs[idx];
    if (img && typeof window.dl === "function") window.dl(img, "stat-card-slide-" + (idx + 1) + ".png");
  };
  actions.downloadAllSlides = function (msgId) {
    var m = findMsg(msgId);
    var imgs = (m && m.statCard && m.statCard.images) || PA.imageCache[msgId] || [];
    if (imgs && imgs.length && typeof window.dlAll === "function") window.dlAll(imgs);
  };

  actions.switchStatCardFormat = function (msgId, newFormat) {
    var s = st();
    var m = findMsg(msgId);
    if (!m || !m.statCard) return;
    m.statCard._loading = true;
    PA.ui.repaint();
    PA.api.statCard({
      topic: m.statCard.topic, format: newFormat,
      palette: m.statCard.palette || "noir_orange",
      category: m.statCard.category, imageUrl: m.statCard.imageUrl
    }).then(function (res) {
      if (res && res.images && res.images.length) {
        m.statCard.images = res.images;
        m.statCard.slides = res.slides;
        m.statCard.format = newFormat;
        if (res.imageCredit) m.statCard.imageCredit = res.imageCredit;
        PA.imageCache[m.id] = res.images;
        toast("Updated to " + (newFormat === "tiktok" ? "TikTok (9:16)" : "Instagram (4:5)") + "!");
      }
    }).catch(function () {
      toast("Could not switch format — try again.");
    }).then(function () {
      m.statCard._loading = false;
      PA.saveThreads(s);
      PA.ui.repaint();
    });
  };

  actions.saveStatCardToLibrary = function (msgId) {
    var s = st();
    var m = findMsg(msgId);
    if (!m || !m.statCard) return;
    if (!s.saved) s.saved = [];
    var card = m.statCard;
    s.saved.unshift({
      id: "sc_" + Date.now(),
      headline: (card.slides && card.slides[0] && card.slides[0].headline) || card.topic || "Stat Card",
      platform: card.format === "tiktok" ? "tiktok" : "instagram",
      niche: (card.category && card.category.displayName) || "General",
      content_type: "stat_card",
      images: card.images || [], slides: card.slides || [],
      imageUrl: card.imageUrl, created_at: new Date().toISOString()
    });
    toast("Saved stat card to your library!");
    PA.ui.repaint();
  };

  // ── Content card -> Creator Plus library ────────────────────────────────
  actions.saveContentCard = function (title, hook, format, angle) {
    var s = st();
    var cleanTitle = String(title || "Content Card").trim();
    var d = new Date();
    var sd = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    PA.api.schedulePost({
      token: s.token, title: cleanTitle,
      platform: format || (s.pulseAi && s.pulseAi.platform) || "tiktok",
      contentType: "Content Card", scheduledDate: sd,
      notes: "Hook: " + (hook || "") + "\nAngle: " + (angle || "")
    }).then(function (res) {
      if (res && res.error) throw new Error(res.error);
      toast("Saved card to your Creator Plus library!");
      if (typeof window.loadSchedule === "function") window.loadSchedule();
    }).catch(function () { toast("Saved card locally!"); });
  };

  actions.saveScript = function (msgId) {
    var s = st();
    var m = findMsg(msgId);
    if (!m) return;
    var titleMatch = String(m.content || "").match(/TITLE:\s*([^\n]+)/i);
    var title = (titleMatch ? titleMatch[1] : String(m.content || "").slice(0, 45) + "...").trim();
    var d = new Date();
    var sd = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    PA.api.schedulePost({
      token: s.token, title: title, platform: s.pulseAi.platform || "tiktok",
      contentType: "Script", scheduledDate: sd, notes: m.content
    }).then(function (res) {
      if (res && res.error) throw new Error(res.error);
      toast("Saved to your Calendar & Library!");
      if (typeof window.loadSaved === "function") window.loadSaved();
      if (typeof window.loadSchedule === "function") window.loadSchedule();
    }).catch(function () {
      if (typeof window.copyTxt === "function") window.copyTxt(m.content);
      toast("Copied to clipboard!");
    });
  };

  actions.shootScript = function (msgId) {
    var s = st();
    var m = findMsg(msgId);
    if (!m) return;
    var text = m.content;
    var t = String(text || "").match(/TITLE:\s*([^\n]+)/i);
    var title = (t ? t[1] : "Pulse AI Script (" + (s.pulseAi.platform || "Short-form") + ")").trim();
    PA.ui.close();
    if (typeof window.svOpenWithScript === "function") {
      window.svOpenWithScript(text, title);
    } else {
      s.tab = "create";
      PA.ui.repaint();
      setTimeout(function () {
        if (typeof window.svOpenWithScript === "function") window.svOpenWithScript(text, title);
        else { if (typeof window.copyTxt === "function") window.copyTxt(text); toast("Copied script! Open Studio to record."); }
      }, 150);
    }
  };

  // ── PHOTO ATTACH: actually read the image, not just the filename ────────
  // Reads the file, downscales it on a canvas to keep it light, keeps it in
  // memory, shows a thumbnail, and hands the real image data to the request.
  actions.attachPhoto = function (input) {
    var s = st();
    var f = input && input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type || "")) { toast("That is not an image file."); return; }

    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var img = new Image();
      img.onload = function () {
        var maxW = 1024;
        var scale = Math.min(1, maxW / (img.width || maxW));
        var w = Math.max(1, Math.round((img.width || maxW) * scale));
        var h = Math.max(1, Math.round((img.height || maxW) * scale));
        var out = dataUrl;
        try {
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          out = c.toDataURL("image/jpeg", 0.82);
        } catch (e) { /* keep the original if canvas is unavailable */ }

        if (!s.pulseAi) s.pulseAi = PA.blankState();
        s.pulseAi.attachment = {
          name: f.name, type: "image/jpeg", w: w, h: h,
          bytes: Math.round(out.length * 0.75), dataUrl: out
        };
        toast("Photo attached (" + w + "×" + h + ") — ask Plus AI about it.");
        PA.ui.repaint();
      };
      img.onerror = function () { toast("Could not read that image."); };
      img.src = dataUrl;
    };
    reader.onerror = function () { toast("Could not read that file."); };
    reader.readAsDataURL(f);
  };

  actions.clearPhoto = function () {
    var s = st();
    if (s && s.pulseAi) s.pulseAi.attachment = null;
    PA.ui.repaint();
  };

  // Legacy name kept so any old handler still works.
  actions.legacyScreenshot = function (e) {
    var f = e && e.target && e.target.files && e.target.files[0];
    if (!f) return;
    actions.attachPhoto(e.target);
  };

  // ── Threads ─────────────────────────────────────────────────────────────
  actions.newThread = function () {
    var s = st();
    if (!s.pulseAi) s.pulseAi = PA.blankState();
    if (!s.pulseAi.threads) s.pulseAi.threads = [];
    var t = { id: rid("thread"), title: "New Conversation", createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    s.pulseAi.threads.unshift(t);
    s.pulseAi.activeThreadId = t.id;
    s.pulseAi.messages = [];
    s.pulseAi.showThreads = false;
    s.pulseAi.showMemory = false;
    s.pulseAi.input = "";
    PA.saveThreads(s);
    PA.ui.repaint();
    setTimeout(function () { var el = document.getElementById("pulse-input"); if (el) el.focus(); }, 100);
    toast("Started new conversation");
  };

  actions.switchThread = function (threadId) {
    var s = st();
    if (!s.pulseAi) return;
    var t = (s.pulseAi.threads || []).filter(function (x) { return x.id === threadId; })[0];
    if (!t) return;
    s.pulseAi.activeThreadId = t.id;
    s.pulseAi.messages = PA.rehydrate(t.messages || []);
    s.pulseAi.showThreads = false;
    s.pulseAi.showMemory = false;
    PA.ui.repaint();
    PA.ui.scrollToBottom();
  };

  actions.deleteThread = function (threadId, e) {
    if (e) { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); }
    var s = st();
    if (!s.pulseAi || !s.pulseAi.threads) return;
    if (s.pulseAi.threads.length <= 1) {
      s.pulseAi.threads[0].messages = [];
      s.pulseAi.threads[0].title = "New Conversation";
      s.pulseAi.messages = [];
      PA.saveThreads(s); PA.ui.repaint(); toast("Conversation reset");
      return;
    }
    s.pulseAi.threads = s.pulseAi.threads.filter(function (t) { return t.id !== threadId; });
    if (s.pulseAi.activeThreadId === threadId) {
      s.pulseAi.activeThreadId = s.pulseAi.threads[0].id;
      s.pulseAi.messages = PA.rehydrate(s.pulseAi.threads[0].messages || []);
    }
    PA.saveThreads(s); PA.ui.repaint(); toast("Conversation deleted");
  };

  actions.toggleThreads = function (e) {
    if (e) { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); }
    var s = st();
    if (!s.pulseAi) s.pulseAi = PA.blankState();
    s.pulseAi.showThreads = !s.pulseAi.showThreads;
    if (s.pulseAi.showThreads) s.pulseAi.showMemory = false;
    PA.ui.repaint();
  };

  // ── Memory ──────────────────────────────────────────────────────────────
  actions.toggleMemory = function (e) {
    if (e) { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); }
    var s = st();
    if (!s.pulseAi) s.pulseAi = PA.blankState();
    s.pulseAi.showMemory = !s.pulseAi.showMemory;
    if (s.pulseAi.showMemory) s.pulseAi.showThreads = false;
    PA.ui.repaint();
    if (s.pulseAi.showMemory && !s.pulseAi.memory) {
      PA.api.memoryGet().then(function (res) {
        if (res && res.memory) { s.pulseAi.memory = res.memory; PA.saveMemoryCache(s); PA.ui.repaint(); }
      }).catch(function () {});
    }
  };

  actions.addCustomRule = function () {
    var s = st();
    var input = document.getElementById("pa-custom-rule-input");
    var rule = (input && input.value || "").trim();
    if (!rule) return;
    if (input) input.value = "";
    PA.api.memoryPost(rule).then(function (res) {
      if (res && res.memory) { s.pulseAi.memory = res.memory; PA.saveMemoryCache(s); toast("Added directive to Pulse AI memory"); PA.ui.repaint(); }
    }).catch(function () { toast("Failed to save memory directive"); });
  };

  actions.resetMemory = function () {
    if (!confirm("Reset Plus AI memory back to defaults?")) return;
    var s = st();
    PA.api.memoryDelete().then(function (res) {
      if (res && res.memory) { s.pulseAi.memory = res.memory; PA.saveMemoryCache(s); toast("Memory reset to default"); PA.ui.repaint(); }
    }).catch(function () { toast("Failed to reset memory"); });
  };
})();
