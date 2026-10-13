/* CreatorPulse — Plus AI · cards.js
 * Turning model text into cards, and stat-card slides into markup.
 *
 * HARD RULE: every function here is wrapped so it can NEVER throw into the
 * page render. render() is a single innerHTML assignment covering the whole
 * app, so one bad message used to abort that assignment: the screen froze on
 * its old picture and every later tap re-threw and did nothing until a reload.
 * A malformed message now degrades to plain text instead.
 */
(function () {
  "use strict";
  var PA = (window.CPPlusAI = window.CPPlusAI || {});
  var cards = (PA.cards = {});

  function esc(t) {
    if (typeof window.esc === "function") return window.esc(t);
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  PA.esc = esc;

  // The one guard every renderer goes through.
  function safe(fn, fallback) {
    try { var out = fn(); return (out === undefined || out === null) ? (fallback || "") : out; }
    catch (e) {
      try { if (window.console) console.warn("Plus AI render fallback:", e && e.message); } catch (_) {}
      return fallback || "";
    }
  }
  PA.safe = safe;

  // ── The mode cards + quick chips shown on an empty conversation ──────────
  cards.PULSE_AI_ACTIONS = [
    { id: "develop",  label: "💡 Develop My Idea", prompt: "I have an idea for a video. Help me develop it into 3 strong creative angles.", action: "ideas" },
    { id: "script",   label: "🎬 Write a Script",  prompt: "Turn my idea into a 30-second camera-ready TikTok script.", action: "script" },
    { id: "overlays", label: "🔥 Text Overlays",   prompt: "Give me 5 controversial 3-7 word text overlays for TikTok with 2-second cues.", action: "hooks" },
    { id: "espn",     label: "🌐 Live ESPN News",  prompt: "Fetch today's breaking ESPN sports headlines and give me 3 viral debate angles.", action: "news" },
    { id: "post",     label: "What to Post Today?", prompt: "What should I post today? Give me 3 tactical options.", action: "what_to_post" },
    { id: "hooks",    label: "⚡ Stronger Hooks",   prompt: "Make my hook punchier, more controversial, and scroll-stopping.", action: "hooks" },
    { id: "cards",    label: "🗂️ Content Cards",   prompt: "Generate three structured static content cards for this topic.", action: "card" },
    { id: "calendar", label: "📅 7-Day Plan",      prompt: "Build me a 7-day high-growth content plan.", action: "calendar" }
  ];
  cards.PULSE_AI_GOALS = ["views", "engagement", "followers", "authority", "leads", "sales", "consistency"];
  cards.PULSE_AI_PLATFORMS = ["tiktok", "instagram", "youtube", "x", "facebook", "linkedin"];

  cards.detectScript = function (text) {
    return safe(function () {
      return /TITLE:\s*[^\n]+/i.test(String(text || "")) && /\[HOOK/i.test(String(text || ""));
    }, false);
  };

  // Pull a topic out of a free-text request, for the stat-card engine.
  cards.extractTopic = function (text) {
    return safe(function () {
      var t = String(text || "");
      var m = t.match(/(?:stat card|post|carousel|for|about|on)\s*[:\-]?\s*(.+)$/i);
      var out = (m ? m[1] : t).replace(/[#*`"']/g, "").trim();
      return out.slice(0, 90) || "Trending Topic";
    }, "Trending Topic");
  };

  // ── Stat-card slides (images come from the in-memory cache) ──────────────
  cards.renderStatCard = function (sc, msgId) {
    return safe(function () {
      if (!sc) return "";
      var imgs = (sc.images && sc.images.length) ? sc.images : (PA.imageCache[msgId] || []);
      if (!imgs.length) {
        if (sc._loading) {
          return '<div class="pa-statcard-box"><div class="pa-sc-loading-scrim" style="position:relative"><span>Rendering your stat card…</span></div></div>';
        }
        return "";
      }
      var isTikTok = sc.format === "tiktok";
      var slideCount = imgs.length;
      var topic = sc.topic || "Topic Breakdown";
      var credit = sc.imageCredit || (sc.imageUrl ? "Verified Live Photo" : null);

      var slidesHtml = imgs.map(function (img, idx) {
        return '<div class="pa-sc-slide" style="flex:0 0 ' + (slideCount > 1 ? "82%" : "100%") + ';min-width:240px;max-width:320px;">' +
          '<div class="pa-sc-img-wrap">' +
            '<img loading="lazy" decoding="async" src="' + img + '" alt="Slide ' + (idx + 1) + '" style="width:100%;aspect-ratio:' + (isTikTok ? "9/16" : "4/5") + ';object-fit:cover;border-radius:12px;border:1px solid var(--br);box-shadow:0 8px 24px rgba(0,0,0,0.3);">' +
          '</div>' +
          '<div class="pa-sc-slide-bar">' +
            '<span class="pa-sc-num">Slide ' + (idx + 1) + ' of ' + slideCount + '</span>' +
            '<button class="pa-chip-mini" onclick="downloadPulseSlide(\'' + msgId + '\',' + idx + ')">⬇ Download</button>' +
          '</div>' +
        '</div>';
      }).join("");

      var dlAllBtn = slideCount > 1
        ? '<button class="pa-act" onclick="downloadPulseAllSlides(\'' + msgId + '\')">⬇ Download All</button>'
        : "";
      var toggleFormatBtn = isTikTok
        ? '<button class="pa-act pa-act-primary" onclick="switchStatCardFormat(\'' + msgId + '\',\'instagram\')">📸 Convert to Instagram (4:5)</button>'
        : '<button class="pa-act pa-act-primary" onclick="switchStatCardFormat(\'' + msgId + '\',\'tiktok\')">📱 Convert to TikTok (9:16)</button>';

      return '<div class="pa-statcard-box">' +
        '<div class="pa-sc-head">' +
          '<div class="pa-sc-title-wrap">' +
            '<span class="pa-sc-badge">' + (isTikTok ? "📱 TikTok (9:16)" : "📸 Instagram Carousel (4:5)") + '</span>' +
            '<div class="pa-sc-title">' + esc(topic) + '</div>' +
          '</div>' +
          (credit ? '<div class="pa-sc-credit"><span>✓</span> ' + esc(credit) + '</div>' : "") +
        '</div>' +
        '<div class="pa-sc-slides-track">' + slidesHtml + '</div>' +
        '<div class="pa-sc-toolbar">' +
          toggleFormatBtn + dlAllBtn +
          '<button class="pa-act" onclick="savePulseStatCardToLibrary(\'' + msgId + '\')">💾 Save</button>' +
        '</div>' +
        (sc._loading ? '<div class="pa-sc-loading-scrim"><span>Regenerating format…</span></div>' : "") +
      '</div>';
    }, "");
  };

  // ── Content-card parser (CARD 01 — TITLE ...) ────────────────────────────
  cards.parseContentCards = function (text) {
    return safe(function () {
      if (!text || !/(?:CARD|Card)\s*\d+/i.test(text)) return null;

      var cardRegex = /(?:^|\n)(?:CARD|Card)\s*(\d+)?\s*[-—:]*\s*([^\n]+)?\n([\s\S]*?)(?=(?:\n(?:CARD|Card)\s*\d+|$))/gi;
      var matches = [];
      var m;
      while ((m = cardRegex.exec(text)) !== null) matches.push(m);
      if (!matches.length) return null;

      var firstCardStart = matches[0].index;
      var preText = text.substring(0, firstCardStart).trim();
      var lastCard = matches[matches.length - 1];
      var postText = text.substring(lastCard.index + lastCard[0].length).trim();

      // String.raw keeps the backslashes verbatim. A template literal would
      // eat them (\s -> s, \* -> *) and hand RegExp() a bare "**", which
      // throws "Nothing to repeat" and used to blank the app.
      var getField = function (body, name) {
        try {
          var r = new RegExp(String.raw`(?:^|\n)\s*(?:\*\*)?` + name + String.raw`(?:\*\*)?\s*:\s*([\s\S]*?)(?=(?:\n\s*(?:\*\*)?[A-Z][a-zA-Z\s/&]+(?:\*\*)?\s*:|$))`, "i");
          var found = body.match(r);
          return found ? found[1].trim() : "";
        } catch (e) { return ""; }
      };

      var cardsHtml = matches.map(function (match, idx) {
        var cardNum = match[1] || String(idx + 1).padStart(2, "0");
        var badge = (match[2] || "CREATIVE ANGLE").trim().replace(/^[-—:]+\s*/, "");
        var body = match[3] || "";

        var title = getField(body, "Title") || getField(body, "Topic") || "Content Concept";
        var format = getField(body, "Content format") || getField(body, "Format") || "Short-form video";
        var hook = getField(body, "Hook") || getField(body, "Opening hook");
        var angle = getField(body, "Creative angle") || getField(body, "Angle");
        var why = getField(body, "Why this angle works") || getField(body, "Why it works");
        var structure = getField(body, "Suggested structure") || getField(body, "Structure");
        var cta = getField(body, "Call to action") || getField(body, "CTA");

        var cleanTitle = esc(title).replace(/['\\]/g, "");
        var cleanHook = esc(hook).replace(/['\\]/g, "");

        var structHtml = "";
        if (structure) {
          var steps = structure.split(/\n\s*\d+\.\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (steps.length > 1) {
            structHtml = '<div class="pa-struct-list">' + steps.map(function (st, i) {
              return '<div class="pa-struct-step"><span class="pa-step-num">' + (i + 1) + '</span> <span>' + esc(st) + '</span></div>';
            }).join("") + '</div>';
          } else {
            structHtml = '<div class="pa-card-val">' + esc(structure).replace(/\n/g, "<br>") + '</div>';
          }
        }

        return '<div class="pa-content-card">' +
          '<div class="pa-cc-head">' +
            '<div class="pa-cc-badge-wrap">' +
              '<span class="pa-cc-num">CARD ' + esc(cardNum) + '</span>' +
              '<span class="pa-cc-type">' + esc(badge) + '</span>' +
            '</div>' +
            '<div class="pa-cc-fmt">📱 ' + esc(format) + '</div>' +
          '</div>' +
          '<div class="pa-cc-title">' + esc(title) + '</div>' +
          (hook ? '<div class="pa-cc-hook-box"><div class="pa-cc-hook-lbl">🎬 HOOK</div>' +
            '<div class="pa-cc-hook-quote">"' + esc(String(hook).replace(/^["'\s]+|["'\s]+$/g, "")) + '"</div></div>' : "") +
          (angle ? '<div class="pa-cc-row"><span class="pa-cc-lbl">Creative Angle:</span> <span class="pa-cc-val">' + esc(angle) + '</span></div>' : "") +
          (why ? '<div class="pa-cc-row"><span class="pa-cc-lbl">Why This Works:</span> <span class="pa-cc-val">' + esc(why) + '</span></div>' : "") +
          (structHtml ? '<div class="pa-cc-row pa-cc-struct"><span class="pa-cc-lbl">Suggested Structure:</span>' + structHtml + '</div>' : "") +
          (cta ? '<div class="pa-cc-cta-row"><span class="pa-cc-lbl">CTA:</span> <span class="pa-cc-cta-val">"' + esc(String(cta).replace(/^["'\s]+|["'\s]+$/g, "")) + '"</span></div>' : "") +
          '<div class="pa-cc-actions">' +
            '<button class="pa-chip-mini pa-chip-action" onclick="sendPulseAiMessage(\'Refine Card #' + esc(cardNum) + ': ' + cleanTitle + '\', \'card\')">🎯 Refine Card</button>' +
            '<button class="pa-chip-mini pa-chip-action" onclick="sendPulseAiMessage(\'Make Card #' + esc(cardNum) + ' more controversial: ' + cleanTitle + '\', \'card\')">🔥 More Controversial</button>' +
            '<button class="pa-chip-mini pa-chip-primary" onclick="sendPulseAiMessage(\'Turn Card #' + esc(cardNum) + ' into a 30s camera-ready TikTok script: ' + cleanTitle + '\', \'script\')">🎬 Turn into Script</button>' +
            '<button class="pa-chip-mini" onclick="window.copyTxt(\'' + cleanTitle + '\\nHook: ' + cleanHook + '\\nFormat: ' + esc(format) + '\\nCTA: ' + esc(cta) + '\');toast(\'Copied Card\')">📋 Copy</button>' +
          '</div>' +
        '</div>';
      }).join("");

      return { preText: preText, cardsHtml: cardsHtml, postText: postText };
    }, null);
  };

  // ── Markdown tables -> cards ─────────────────────────────────────────────
  cards.parseTablesToCards = function (raw) {
    return safe(function () {
      var lines = String(raw || "").split("\n");
      var out = [];
      var inTable = false;
      var headers = [];
      var tableRows = [];

      function flushTable() {
        if (!tableRows.length) return;
        var html = tableRows.map(function (row, idx) {
          var num = idx + 1;
          var title = "";
          var details = [];
          row.forEach(function (cell, cellIdx) {
            var h = (headers[cellIdx] || "").toLowerCase();
            if (cellIdx === 0 && /^\d+$/.test(cell)) {
              num = cell;
            } else if (!title && (h.indexOf("hook") >= 0 || h.indexOf("overlay") >= 0 || h.indexOf("text") >= 0 || h.indexOf("title") >= 0 || cellIdx <= 1)) {
              title = cell.replace(/^["'\s]+|["'\s]+$/g, "");
            } else {
              details.push('<div class="pa-card-row"><span class="pa-card-lbl">' + esc(headers[cellIdx] || "Note") + ':</span> <span class="pa-card-val">' + esc(cell) + '</span></div>');
            }
          });
          if (!title) title = row[0] || ("Item #" + num);
          var cleanTitle = esc(title).replace(/['\\]/g, "");
          return '<div class="pa-card">' +
            '<div class="pa-card-top"><span class="pa-badge">#' + num + '</span>' +
            '<div class="pa-card-title">' + esc(title) + '</div></div>' +
            (details.length ? '<div class="pa-card-body">' + details.join("") + '</div>' : "") +
            '<div class="pa-card-actions">' +
              '<button class="pa-chip-mini" onclick="window.generatePulseStatCard(\'' + cleanTitle + '\', \'instagram\')">📸 Instagram Post</button>' +
              '<button class="pa-chip-mini" onclick="window.generatePulseStatCard(\'' + cleanTitle + '\', \'tiktok\')">📱 TikTok Post</button>' +
              '<button class="pa-chip-mini" onclick="sendPulseAiMessage(\'Turn this into a 30s TikTok script: ' + cleanTitle + '\', \'script\')">🎬 Script</button>' +
              '<button class="pa-chip-mini" onclick="window.copyTxt(\'' + cleanTitle + '\');toast(\'Copied\')">📋 Copy</button>' +
            '</div>' +
          '</div>';
        }).join("");
        out.push('<div class="pa-cards-grid">' + html + '</div>');
        headers = []; tableRows = []; inTable = false;
      }

      for (var i = 0; i < lines.length; i++) {
        var l = lines[i].trim();
        if (l.charAt(0) === "|" && l.charAt(l.length - 1) === "|") {
          var cells = l.split("|").slice(1, -1).map(function (c) { return c.trim(); });
          if (cells.every(function (c) { return /^[-:\s]+$/.test(c); })) continue;
          if (!inTable) { inTable = true; headers = cells; tableRows = []; }
          else tableRows.push(cells);
        } else {
          if (inTable) flushTable();
          out.push(l);
        }
      }
      if (inTable) flushTable();
      return out.join("\n");
    }, String(raw || ""));
  };

  // ── ### sections -> cards ────────────────────────────────────────────────
  cards.parseSectionsToCards = function (text) {
    return safe(function () {
      return String(text || "").replace(/(^|\n)###?\s*(\d+|Option\s*\d+|Day\s*\d+)[.:—\s]*([^\n]+)([\s\S]*?)(?=(?:\n###?\s*(?:\d+|Option|Day)|$))/gi,
        function (match, prefix, num, title, body) {
          var cleanNum = num.trim();
          var cleanTitle = title.trim();
          var cleanBody = body.trim()
            .replace(/^\s*[-•]\s*\*\*([^:]+):\*\*\s*([^\n]+)/gm, '<div class="pa-card-row"><span class="pa-card-lbl">$1:</span> <span class="pa-card-val">$2</span></div>')
            .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
            .replace(/\n/g, "<br>");
          var actionText = cleanTitle.replace(/^["'\s]+|["'\s]+$/g, "").replace(/['\\]/g, "");
          return prefix + '<div class="pa-card">' +
            '<div class="pa-card-top"><span class="pa-badge">' + esc(cleanNum) + '</span>' +
            '<div class="pa-card-title">' + esc(cleanTitle) + '</div></div>' +
            (cleanBody ? '<div class="pa-card-body">' + cleanBody + '</div>' : "") +
            '<div class="pa-card-actions">' +
              '<button class="pa-chip-mini" onclick="sendPulseAiMessage(\'Turn this into a 30s TikTok script: ' + actionText + '\', \'script\')">🎬 Turn into Script</button>' +
              '<button class="pa-chip-mini" onclick="window.copyTxt(\'' + actionText + '\');toast(\'Copied\')">📋 Copy</button>' +
            '</div>' +
          '</div>';
        });
    }, String(text || ""));
  };

  // ── Follow-up chips under a reply ────────────────────────────────────────
  cards.getFollowupChips = function (text, action) {
    return safe(function () {
      var lower = String(text || "").toLowerCase();
      var chips = [];
      if (lower.indexOf("card 01") >= 0 || lower.indexOf("creative angle") >= 0 || action === "card") {
        chips.push({ label: "🎬 Turn Card #1 into Script", prompt: "Turn Card #1 into a camera-ready 30-second TikTok script with visual cues.", action: "script" });
        chips.push({ label: "🔥 Make Cards More Controversial", prompt: "Make these angles more controversial and debate-heavy to trigger 500+ comments.", action: "card" });
        chips.push({ label: "⚡ 3 Alternative Hooks", prompt: "Give me 3 alternative scroll-stopping hooks for Card #1.", action: "hooks" });
      } else if (lower.indexOf("hook") >= 0 || lower.indexOf("overlay") >= 0 || action === "hooks") {
        chips.push({ label: "⚡ 5 More Controversial Hooks", prompt: "Give me 5 more controversial text-overlay hooks for TikTok.", action: "hooks" });
        chips.push({ label: "🎬 Turn #1 into Script", prompt: "Turn hook #1 into a camera-ready 30-second TikTok script with 2s visual cues.", action: "script" });
        chips.push({ label: "📸 Turn into Instagram Stat Card", prompt: "Change this into an Instagram post stat card with dilemma comparison and real photo.", action: "stat_card" });
        chips.push({ label: "📱 Turn into TikTok Post", prompt: "Change this into a TikTok post with real background photo and dilemma breakdown.", action: "tiktok_post" });
        chips.push({ label: "🗂️ Generate Content Cards", prompt: "Generate 3 static content cards for these hooks.", action: "card" });
      } else if (lower.indexOf("title:") >= 0 || lower.indexOf("[hook") >= 0 || action === "script") {
        chips.push({ label: "🔥 Make Hook More Controversial", prompt: "Make the hook of this script 10x more controversial and punchy.", action: "hooks" });
        chips.push({ label: "⚡ Shorten to 20s High-Velocity", prompt: "Cut this script down to a super fast 20-second high-retention version.", action: "script" });
        chips.push({ label: "📝 3 Captions & CTAs", prompt: "Write 3 punchy captions with high-converting CTAs for this video.", action: "chat" });
      } else if (lower.indexOf("espn") >= 0 || lower.indexOf("news") >= 0 || lower.indexOf("today") >= 0) {
        chips.push({ label: "🗂️ 3 Debate Content Cards", prompt: "Turn today's sports headlines into 3 structured static content cards.", action: "card" });
        chips.push({ label: "🎬 30s Breaking News Script", prompt: "Write a 30-second breaking sports news breakdown script.", action: "script" });
        chips.push({ label: "⚡ 5 Viral Debate Hooks", prompt: "Give me 5 viral debate hooks based on today's sports news.", action: "hooks" });
      } else {
        chips.push({ label: "🗂️ Generate 3 Content Cards", prompt: "Turn this into 3 structured static content cards.", action: "card" });
        chips.push({ label: "🎬 30s TikTok Script", prompt: "Turn this idea into a camera-ready 30-second script for Studio.", action: "script" });
        chips.push({ label: "🌐 Live ESPN & Sports News", prompt: "Check live ESPN and sports headlines for hot topics I can post about today.", action: "chat" });
      }
      return chips.slice(0, 3);
    }, []);
  };

  // ── A single assistant message's body ────────────────────────────────────
  cards.renderMsgContent = function (text, msgId, action) {
    return safe(function () {
      var cardsRes = cards.parseContentCards(text);
      if (cardsRes) {
        var preHtml = cardsRes.preText
          ? '<div class="pa-lead-text">' + esc(cardsRes.preText).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>") + '</div>' : "";
        var postHtml = cardsRes.postText
          ? '<div class="pa-tail-text">' + esc(cardsRes.postText).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>") + '</div>' : "";
        return preHtml + '<div class="pa-content-cards-wrap">' + cardsRes.cardsHtml + '</div>' + postHtml;
      }
      var processed = cards.parseTablesToCards(text);
      processed = cards.parseSectionsToCards(processed);
      processed = processed.replace(/\[HOOK\s*[-–—]?\s*([^\]]+)\]/gi, '<div class="pa-cue-badge pa-cue-hook">🎬 HOOK ($1)</div>');
      processed = processed.replace(/\[BODY\s*[-–—]?\s*([^\]]+)\]/gi, '<div class="pa-cue-badge pa-cue-body">🎥 BODY ($1)</div>');
      processed = processed.replace(/\[PAYOFF & CTA\s*[-–—]?\s*([^\]]+)\]/gi, '<div class="pa-cue-badge pa-cue-cta">⚡ PAYOFF &amp; CTA ($1)</div>');
      var html = processed;
      html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      html = html.replace(/(^|\n)###?\s*([^<\n]+)/g, '$1<div class="pa-h">$2</div>');
      html = html.replace(/(^|\n)\s*[-•]\s*/g, "$1• ");
      html = html.replace(/\n/g, "<br>");
      return html;
    }, esc(String(text || "")).replace(/\n/g, "<br>"));
  };
})();
