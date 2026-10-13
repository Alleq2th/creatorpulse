/* CreatorPulse — Plus AI · ui.js
 * The sheet, its drawers, and the repaint hook.
 *
 * Repaint goes through window.render() when it is available so Plus AI stays
 * inside the app's single render pipeline; otherwise it re-renders only the
 * floating-coach host. Either way it is wrapped in try/catch — a repaint must
 * never be able to blank the app or leave a backdrop swallowing taps.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});
  var ui = (PA.ui = {});

  // core.js declares `const S` at top level. In a classic script that makes S a
  // GLOBAL LEXICAL binding: reachable as a bare name from any later script, but
  // NOT as window.S. Resolve it either way so this never silently no-ops.
  function st() { return (typeof S !== "undefined" ? S : null) || window.S || null; }
  function S_(s) { s = s || st(); if (s && !s.pulseAi) s.pulseAi = PA.blankState(); return s; }
  function esc(t) { return PA.esc(t); }
  function sparkle() { try { return (window.I && window.I.sparkle) || "✦"; } catch (e) { return "✦"; } }

  // A single choke point for every whole-app repaint.
  ui.repaint = function () {
    try {
      if (typeof window.render === "function") { window.render(); return; }
      var host = document.getElementById("plus-ai-host");
      if (host) host.innerHTML = ui.floatingCoach();
    } catch (e) {
      try { console.warn("Plus AI repaint fallback:", e && e.message); } catch (_) {}
      // Last resort: make sure no backdrop can swallow taps.
      try {
        var ov = document.querySelector(".sheet-overlay");
        if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      } catch (_) {}
    }
  };

  ui.scrollToBottom = function () {
    setTimeout(function () {
      try { var l = document.getElementById("pulse-chat-messages"); if (l) l.scrollTop = l.scrollHeight; } catch (e) {}
    }, 60);
  };

  ui.close = function () {
    var s = S_();
    s.pulseAi.open = false;
    s.pulseAi.showMemory = false;
    s.pulseAi.showThreads = false;
    s.coachOpen = false;
    ui.repaint();
  };

  // ── Threads drawer ──────────────────────────────────────────────────────
  ui.threadsDrawer = function (s) {
    s = S_(s);
    var threads = (s.pulseAi && s.pulseAi.threads) || [];
    var activeId = s.pulseAi && s.pulseAi.activeThreadId;
    return '<div class="pa-threads-drawer">' +
      '<div class="pa-threads-header">' +
        '<div class="pa-threads-title">💬 Conversations (' + threads.length + ')</div>' +
        '<div class="pa-threads-head-actions">' +
          '<button class="pa-chip-mini pa-chip-primary" onclick="newPulseAiThread()">+ New Chat</button>' +
          '<button class="pa-mem-close" onclick="togglePulseAiThreads(event)">×</button>' +
        '</div>' +
      '</div>' +
      '<p class="pa-mem-desc">Switch between creative brainstorming sessions, video scripts, and research threads.</p>' +
      '<div class="pa-threads-list">' +
        threads.map(function (t) {
          var isActive = t.id === activeId;
          var msgCount = (t.messages || []).length;
          var dateStr = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Today";
          return '<div class="pa-thread-item ' + (isActive ? "pa-thread-active" : "") + '" onclick="switchPulseAiThread(\'' + t.id + '\')">' +
            '<div class="pa-thread-info">' +
              '<div class="pa-thread-title">' + esc(t.title || "Creative Session") + '</div>' +
              '<div class="pa-thread-meta">' + dateStr + ' · ' + msgCount + ' msgs</div>' +
            '</div>' +
            '<div class="pa-thread-actions">' +
              (isActive ? '<span class="pa-thread-curr-pill">Active</span>' : "") +
              '<button class="pa-thread-del" onclick="deletePulseAiThread(\'' + t.id + '\', event)" title="Delete conversation">🗑️</button>' +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>' +
    '</div>';
  };

  // ── Memory drawer ───────────────────────────────────────────────────────
  ui.memoryDrawer = function (s) {
    s = S_(s);
    var mem = (s.pulseAi && s.pulseAi.memory) || {
      characterTraits: ["Direct, punchy, and high-energy", "Debate-driven and opinionated", "Action-oriented creator"],
      likes: ["Controversial text overlays (3-7 words) at 2s mark", "Fast 20-30s camera-ready TikTok scripts", "WWE & sports debates (John Cena, Roman Reigns, NBA, LeBron)"],
      dislikes: ["Open-ended questions ('What is the play?')", "Generic motivational filler", "Raw ASCII tables and markdown pipes"],
      keyTopics: ["WWE Wrestling", "NBA & LeBron", "NFL & Mahomes", "ESPN Sports News"],
      customRules: ["Never ask open-ended questions — always give clear options", "Keep scripts punchy with 2-second visual cues"]
    };
    var tags = function (arr, cls, prefix) {
      return (arr || []).map(function (x) { return '<span class="pa-mem-tag ' + cls + '">' + (prefix || "") + esc(x) + '</span>'; }).join("");
    };
    return '<div class="pa-mem-drawer">' +
      '<div class="pa-mem-header">' +
        '<div class="pa-mem-title">🧠 Plus AI Creator Memory</div>' +
        '<button class="pa-mem-close" onclick="togglePulseAiMemory(event)">×</button>' +
      '</div>' +
      '<p class="pa-mem-desc">Plus AI learns your voice, preferences, topics, and pet peeves so it never wastes your time with generic filler.</p>' +
      '<div class="pa-mem-sec"><div class="pa-mem-sec-title">Learned Character Traits</div><div class="pa-mem-tags">' + tags(mem.characterTraits, "pa-mem-tag-trait") + '</div></div>' +
      '<div class="pa-mem-sec"><div class="pa-mem-sec-title">What You Love (Likes)</div><div class="pa-mem-tags">' + tags(mem.likes, "pa-mem-tag-like", "✓ ") + '</div></div>' +
      '<div class="pa-mem-sec"><div class="pa-mem-sec-title">What Plus AI Avoids (Dislikes)</div><div class="pa-mem-tags">' + tags(mem.dislikes, "pa-mem-tag-dislike", "✕ ") + '</div></div>' +
      '<div class="pa-mem-sec"><div class="pa-mem-sec-title">Topics &amp; Entities Remembered</div><div class="pa-mem-tags">' + tags(mem.keyTopics, "pa-mem-tag-topic", "# ") + '</div></div>' +
      '<div class="pa-mem-sec"><div class="pa-mem-sec-title">Custom Directives</div><div class="pa-mem-tags">' + tags(mem.customRules, "pa-mem-tag-rule", "⚡ ") + '</div></div>' +
      '<div class="pa-mem-add-row">' +
        '<input id="pa-custom-rule-input" class="pa-mem-input" placeholder="Add custom directive (e.g. Always suggest WWE angles)" onkeydown="if(event.key===\'Enter\'){addPulseAiCustomRule();}">' +
        '<button class="pa-mem-btn" onclick="addPulseAiCustomRule()">+ Add</button>' +
      '</div>' +
      '<div class="pa-mem-footer"><button class="pa-mem-reset-btn" onclick="resetPulseAiMemory()">Reset to default memory</button></div>' +
    '</div>';
  };

  // ── The floating coach: FAB + sheet ─────────────────────────────────────
  ui.floatingCoach = function () {
    var s = st();
    if (!s || s.mode !== "app") return "";
    s = S_(s);
    var P = s.pulseAi;
    var open = !!P.open;
    var hasMessages = P.messages && P.messages.length > 0;
    var fab = '<button id="fab-coach" class="fab-coach" onclick="openPulseAi()" aria-label="Pulse AI">' + sparkle() + '<span>Pulse AI</span></button>';
    if (!open) return fab;

    var traitCount = ((P.memory && P.memory.characterTraits && P.memory.characterTraits.length) || 3) +
                     ((P.memory && P.memory.likes && P.memory.likes.length) || 4);
    var threadCount = (P.threads && P.threads.length) || 1;

    var ACTIONS = (PA.cards && PA.cards.PULSE_AI_ACTIONS) || [];
    var quickChips = !hasMessages ? ACTIONS.map(function (a) {
      return '<button class="pa-chip" onclick="sendPulseAiMessage(\'' + String(a.prompt).replace(/['\\]/g, "") + '\', \'' + a.action + '\')">' + a.label + '</button>';
    }).join("") : "";

    // Each message row goes through PA.safe so one malformed message cannot
    // abort the whole-page innerHTML assignment.
    var messagesHtml = hasMessages ? P.messages.map(function (m) {
      if (m.role === "user") {
        return '<div class="pa-msg pa-msg-user"><div class="pa-bubble pa-bubble-user">' +
          esc(m.content).replace(/\n/g, "<br>") + '</div></div>';
      }
      var isScript = PA.cards.detectScript(m.content);
      var followups = PA.cards.getFollowupChips(m.content, m.action);
      var followupsHtml = followups.length ? '<div class="pa-followups">' +
        '<div class="pa-follow-lbl">Next moves:</div><div class="pa-follow-chips">' +
        followups.map(function (f) {
          return '<button class="pa-follow-chip" onclick="sendPulseAiMessage(\'' + String(f.prompt).replace(/['\\]/g, "") + '\', \'' + f.action + '\')">' + f.label + '</button>';
        }).join("") + '</div></div>' : "";
      var statCardHtml = m.statCard ? PA.safe(function () { return PA.cards.renderStatCard(m.statCard, m.id); }, "") : "";
      var body = PA.safe(function () { return PA.cards.renderMsgContent(m.content, m.id, m.action); }, esc(m.content || ""));
      return '<div class="pa-msg pa-msg-ai">' + statCardHtml +
        '<div class="pa-bubble pa-bubble-ai">' + body + '</div>' +
        '<div class="pa-msg-actions">' +
          (isScript ? '<button class="pa-act pa-act-primary" onclick="pulseAiShootScript(\'' + m.id + '\')">🎬 Shoot in Studio</button>' : "") +
          '<button class="pa-act" onclick="pulseAiSaveScript(\'' + m.id + '\')">💾 Save</button>' +
          '<button class="pa-act" onclick="copyPulseAiMessage(\'' + m.id + '\')">📋 Copy</button>' +
        '</div>' + followupsHtml +
      '</div>';
    }).join("") : (
      '<div class="pa-welcome">' +
        '<div class="pa-welcome-icon">' + sparkle() + '</div>' +
        '<h4>Plus AI — Your Creative Partner</h4>' +
        '<p>Brainstorm bold angles, develop your own ideas into camera-ready scripts, or generate real stat-card images.</p>' +
      '</div>' +
      '<div class="pa-modes-grid">' +
        '<div class="pa-mode-card" onclick="generatePulseStatCard(\'United States Marines\', \'instagram\')">' +
          '<div class="pa-mode-badge" style="background:var(--ac);color:#000;">MODE C</div>' +
          '<div class="pa-mode-title">📸 Stat Cards &amp; Posts</div>' +
          '<div class="pa-mode-desc">Real rendered Instagram 4:5 carousels &amp; TikTok 9:16 posts with live photos.</div>' +
        '</div>' +
        '<div class="pa-mode-card" onclick="sendPulseAiMessage(\'I have an idea for a video. Help me develop it into 3 strong creative angles.\', \'ideas\')">' +
          '<div class="pa-mode-badge">MODE B</div>' +
          '<div class="pa-mode-title">💡 Bring Your Own Idea</div>' +
          '<div class="pa-mode-desc">Bring any concept, question, or rough topic and turn it into cards.</div>' +
        '</div>' +
        '<div class="pa-mode-card" onclick="sendPulseAiMessage(\'Fetch today\\\'s breaking ESPN sports headlines and give me 3 viral debate angles.\', \'news\')">' +
          '<div class="pa-mode-badge">MODE A</div>' +
          '<div class="pa-mode-title">🌐 Live ESPN &amp; Trends</div>' +
          '<div class="pa-mode-desc">Real-time headlines and breaking sports debates ready to film today.</div>' +
        '</div>' +
      '</div>' +
      '<div class="pa-chips">' + quickChips + '</div>'
    );

    var drawerContent = messagesHtml;
    if (P.showThreads) drawerContent = ui.threadsDrawer(s);
    else if (P.showMemory) drawerContent = ui.memoryDrawer(s);

    var attachHtml = P.attachment
      ? '<div class="pa-attach-chip"><img src="' + P.attachment.dataUrl + '" alt="attachment"/>' +
        '<span>' + esc(P.attachment.name || "photo") + '</span>' +
        '<button onclick="clearPulseAiPhoto()" aria-label="Remove photo">×</button></div>'
      : "";

    return fab +
      '<div class="sheet-overlay open" onclick="if(event.target===this){closePulseAi()}">' +
        '<div class="sheet pulse-ai-sheet" onclick="event.stopPropagation()">' +
          '<div class="sheet-grip"></div>' +
          '<div class="sheet-h">' +
            '<div class="pa-header">' +
              '<div class="pa-logo">' + sparkle() + '</div>' +
              '<div><h3>Plus AI</h3><div class="pa-sub">Your creative partner</div></div>' +
            '</div>' +
            '<div class="pa-header-actions">' +
              '<button class="pa-head-btn" onclick="newPulseAiThread()" title="Start New Chat">+ New</button>' +
              '<button class="pa-head-btn ' + (P.showThreads ? "pa-head-btn-active" : "") + '" onclick="togglePulseAiThreads(event)" title="Conversations">💬 <span>' + threadCount + '</span></button>' +
              '<button class="pa-head-btn ' + (P.showMemory ? "pa-head-btn-active" : "") + '" onclick="togglePulseAiMemory(event)" title="Creator Memory Profile">🧠 <span>' + traitCount + '</span></button>' +
              '<button class="sheet-close" onclick="closePulseAi()">×</button>' +
            '</div>' +
          '</div>' +
          '<div class="pa-context-bar">' +
            '<span class="pa-context-pill">📱 ' + esc(String(P.platform || "tiktok").toUpperCase()) + '</span>' +
            '<span class="pa-context-pill">🎯 ' + esc(P.goal || "views") + '</span>' +
            '<span class="pa-context-pill">🔥 ' + esc(P.niche || "creator") + '</span>' +
          '</div>' +
          '<div class="pa-chat" id="pulse-chat-messages">' +
            drawerContent +
            (P.loading ? '<div class="pa-msg pa-msg-ai"><div class="pa-bubble pa-bubble-ai pa-typing"><span></span><span></span><span></span></div></div>' : "") +
            ((s.errors && s.errors.pulseAi) ? PA.safe(function () { return window.errCard(s.errors.pulseAi, "sendPulseAiMessage", "pulseAi"); }, "") : "") +
          '</div>' +
          '<div class="pa-inputbar">' +
            '<label class="pa-attach-btn" title="Attach a photo">📎' +
              '<input type="file" accept="image/*" style="display:none" onchange="plusAiAttachPhoto(this)">' +
            '</label>' +
            '<textarea id="pulse-input" class="pa-input" rows="1" placeholder="Tell Plus AI what you want to create..." ' +
              'oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,120)+\'px\';S.pulseAi.input=this.value" ' +
              'onkeydown="if(event.key===\'Enter\' && !event.shiftKey){event.preventDefault();sendPulseAiMessage();}">' + esc(P.input || "") + '</textarea>' +
            '<button class="pa-send" onclick="sendPulseAiMessage()" ' + (P.loading ? "disabled" : "") + ' aria-label="Send">' + (function () { try { return (window.I && window.I.bolt) || "➤"; } catch (e) { return "➤"; } })() + '</button>' +
          '</div>' +
          attachHtml +
        '</div>' +
      '</div>';
  };
})();
