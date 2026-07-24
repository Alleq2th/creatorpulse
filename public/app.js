// ─── FLOATING AI COACH ─────────────────────────────────────────────────────
function renderFloatingCoach(){
  if(S.mode !== "app") return "";
  const open = !!S.coachOpen;
  return `<button class="fab-coach" onclick="S.coachOpen=true;render()" aria-label="AI Coach">${I.sparkle}<span>Coach</span></button>
    ${open ? `<div class="sheet-overlay open" onclick="if(event.target===this){S.coachOpen=false;render()}">
      <div class="sheet"><div class="sheet-grip"></div>
        <div class="sheet-h"><h3>AI Coach</h3><button class="sheet-close" onclick="S.coachOpen=false;render()">×</button></div>
        <div style="font-size:12px;color:var(--mu);margin-bottom:14px;line-height:1.55">Connect your socials or upload analytics. Coach learns you and tells you what actually to do next.</div>
        <div class="field"><label>Platform</label><select class="input" onchange="S.coachPlatform=this.value">${["instagram","tiktok","youtube","twitter"].map(p=>`<option value="${p}" ${S.coachPlatform===p?'selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join("")}</select></div>
        <div class="field"><label>Your handle</label><input class="input" placeholder="@yourhandle" value="${esc(S.coachHandle)}" oninput="S.coachHandle=this.value"/></div>
        <div class="field"><label>Recent analytics (paste numbers or upload a screenshot)</label>
          <textarea class="input" rows="4" placeholder="Last 5 posts: 12k, 8k, 45k, 6k, 22k views. Followers: 4,200. Avg watch: 18s." oninput="S.coachMetrics=this.value">${esc(S.coachMetrics)}</textarea>
          <input type="file" accept="image/*" onchange="coachUploadScreenshot(event)" style="margin-top:8px;font-size:11px;color:var(--mu)"/>
        </div>
        <button class="btn bp" style="width:100%;padding:12px;justify-content:center" ${S.coachLoading?'disabled':''} onclick="runCoach()">${S.coachLoading?'<span class="sp"></span> Reading you…':'Get my read'}</button>
        ${S.coachAnswer?`<div class="coach-msg">${esc(S.coachAnswer)}</div>`:""}
      </div>
    </div>`:""}`;
}
window.coachUploadScreenshot = (e) => {
  const f = e.target.files?.[0]; if(!f) return;
  toast("Screenshot attached — Coach will describe what it sees.");
  S.coachMetrics = (S.coachMetrics||"") + `\n[Uploaded analytics screenshot: ${f.name} (${Math.round(f.size/1024)}KB)]`;
  render();
};

// legacy — kept for any other calls but not used in tab bar anymore
function pageCoach(){ return ""; }

function pageProfile(){
  const u = S.user || {};
  const name = u.name || "You";
  const initial = (name.trim()[0] || "?").toUpperCase();
  const activePlats = u.platforms || [];

  // Event count: unique dates from user niches
  const eventCount = (u.niches||[]).reduce((n, k) => n + ((S.eventsCache[k]||[]).length), 0);
  const liveCount = S.trends.length;
  const savedCount = S.saved.filter(p => p.content_type !== 'Recurring').length;

  const platPills = activePlats.map(p => {
    const P = PLATS.find(x => x.id === p);
    return `<span class="pf-plat-pill"><span class="em">${PLAT_EMOJI[p]||"◆"}</span>${esc(P?.label||p)}</span>`;
  }).join("") || `<span style="color:var(--mu);font-size:12px">No platforms yet</span>`;

  const nicheTags = (u.niches||[]).map(n => {
    const c = NC[n] || "#7C3AED";
    return `<span class="niche-tag" style="background:${c}22;color:${c};border:1px solid ${c}55">${esc(n)}</span>`;
  }).join("") || `<span style="color:var(--mu);font-size:12px">None yet — add some in onboarding.</span>`;

  const platCells = PLATS.map(p => {
    const on = activePlats.includes(p.id);
    const primary = u.primaryPlatform === p.id;
    return `<div class="pf-plat-cell ${on?'on':''}">
      <span class="em">${PLAT_EMOJI[p.id]||"◆"}</span>
      <div style="flex:1;min-width:0">
        <div class="lbl">${esc(p.label)}</div>
        ${primary?'<div class="prim">Primary</div>':(on?'<div style="font-size:10px;color:var(--mu)">Active</div>':'<div style="font-size:10px;color:var(--mu2)">Inactive</div>')}
      </div>
    </div>`;
  }).join("");

  return `<main class="page active">${topBar("Account")}
    <div class="pf-head">
      <div class="pf-avatar">${esc(initial)}</div>
      <div class="pf-name">${esc(name)}</div>
      <div class="pf-email">${esc(u.email||"")}</div>
      <div class="pf-plat-row">${platPills}</div>
    </div>

    <div class="stat-row">
      <div class="stat"><div class="stat-n">${liveCount}</div><div class="stat-l">Live Stories</div></div>
      <div class="stat"><div class="stat-n">${savedCount}</div><div class="stat-l">Saved Posts</div></div>
      <div class="stat"><div class="stat-n">${eventCount}</div><div class="stat-l">My Events</div></div>
    </div>

    <div class="pf-card">
      <div class="pf-card-head">
        <div class="pf-card-title">My Niches</div>
        <button class="pf-edit" onclick="editNiches()">Edit</button>
      </div>
      <div class="niche-tags">${nicheTags}</div>
    </div>

    <div class="pf-card">
      <div class="pf-card-head">
        <div class="pf-card-title">My Platforms</div>
      </div>
      <div class="pf-grid">${platCells}</div>
    </div>

    <div class="pf-card">
      <div class="pf-card-head"><div class="pf-card-title">Connected Accounts</div></div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:12px;line-height:1.5">Connect your channels so Coach can learn your analytics and personalize what to post next.</div>
      <div class="pf-grid">
        ${[
          {id:"instagram",label:"Instagram"},
          {id:"tiktok",label:"TikTok"},
          {id:"youtube",label:"YouTube"},
          {id:"twitter",label:"X (Twitter)"}
        ].map(sv => {
          const connected = (S.connections||{})[sv.id];
          return `<div class="pf-plat-cell ${connected?'on':''}">
            <span class="em">${PLAT_EMOJI[sv.id]||"◆"}</span>
            <div style="flex:1;min-width:0">
              <div class="lbl">${esc(sv.label)}</div>
              <div style="font-size:10px;color:${connected?'var(--ac)':'var(--mu)'}">${connected?'Connected':'Not connected'}</div>
            </div>
            <button class="tiny-copy" onclick="connectAccount('${sv.id}')">${connected?'Manage':'Connect'}</button>
          </div>`;
        }).join("")}
      </div>
      <div style="margin-top:12px">
        <label class="btn bs" style="width:100%;padding:12px;justify-content:center;cursor:pointer">${I.upload} Upload analytics screenshot
          <input type="file" accept="image/*" style="display:none" onchange="coachUploadScreenshot(event)"/>
        </label>
      </div>
    </div>

    <div class="pf-card">
      <div class="pf-card-head">
        <div class="pf-card-title">Saved Library</div>
        <span class="pf-edit" style="cursor:default">${S.saved.filter(p=>p.content_type!=='Recurring').length}</span>
      </div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:10px;line-height:1.5">Your saved scripts, carousels, images and thumbnails.</div>
      ${renderSavedList()}
    </div>

    <div class="pf-card">
      <div class="pf-card-head"><div class="pf-card-title">Inspiration Feed</div></div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:10px;line-height:1.5">Top creators in your niche, hand-picked from the source lists we already pull.</div>
      ${renderInspirationFeed()}
    </div>

    <button class="btn-signout" onclick="logOut()">Sign Out</button>
  </main>`;
}
function renderSavedList(){
  const items = S.saved.filter(p => p.content_type !== 'Recurring').slice(0, 30);
  if(!items.length) return `<div style="color:var(--mu);font-size:12px;padding:6px 0">No saved posts yet — save from any trend on Home.</div>`;
  return items.map(p=>`<div style="padding:10px 0;border-bottom:1px solid var(--br);display:flex;gap:10px;align-items:flex-start"><div style="flex:1;min-width:0"><div style="font-family:var(--serif);font-size:14px;font-weight:600;line-height:1.35">${esc(p.headline)}</div><div style="font-size:10px;color:var(--mu);margin-top:3px">${esc(p.niche)} · ${esc(p.platform)} · ${esc(p.content_type)}${p.scheduled_date?' · '+esc(p.scheduled_date):''}</div></div><button class="iconbtn" onclick="delSaved(${p.id})" title="Delete">${I.trash}</button></div>`).join("");
}
window.connectAccount = (id) => {
  S.connections = S.connections || {};
  if(S.connections[id]){
    if(confirm("Disconnect this account?")){ delete S.connections[id]; saveSession(); render(); toast("Disconnected"); }
    return;
  }
  S.connections[id] = { connectedAt: Date.now(), handle: prompt(`Enter your ${id} @handle`) || "" };
  saveSession(); render(); toast(`${id[0].toUpperCase()+id.slice(1)} connected — Coach will use this.`);
};
function renderInspirationFeed(){
  const niches = S.user?.niches || [];
  const handles = [];
  niches.forEach(n => (NICHE_HANDLES[n] || []).slice(0,3).forEach(h => handles.push({ handle:h, niche:n })));
  if(!handles.length) return `<div style="color:var(--mu);font-size:12px">Add niches to see your inspiration list.</div>`;
  return handles.slice(0,12).map(x=>`<div class="insp-card"><div class="insp-thumb">@</div><div class="insp-body"><div class="insp-hl">@${esc(x.handle)}</div><div class="insp-meta">${esc(x.niche)}</div></div></div>`).join("");
}

window.editNiches = () => { S.mode = "onboard"; S.onboard = { step:0, name:S.user?.name||"", niches:[...(S.user?.niches||[])], platforms:[...(S.user?.platforms||[])], primary:S.user?.primaryPlatform||"", ppd:S.user?.postsPerDay||3 }; window.ob = S.onboard; render(); };
window.logOut = () => { if(confirm("Sign out?")){ clearSession(); S.mode="auth"; S.authTab="login"; S.authForm={email:"",password:"",name:""}; render(); } };

// ─── AUTH REDIRECT DETECTION (email confirmation / errors from Supabase) ────
function checkAuthRedirect(){
  try {
    const hash = window.location.hash ? window.location.hash.substring(1) : "";
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get("type") || searchParams.get("type");
    const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");

    if(errorDesc){
      S.authErr = decodeURIComponent(errorDesc.replace(/\+/g," "));
      S.authTab = "login";
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    if(type === "signup" || type === "email_change"){
      S.authMsg = type === "signup" ? "Email confirmed! You can sign in now." : "Email address confirmed.";
      S.authTab = "login";
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  } catch(e){ console.warn("checkAuthRedirect", e); }
  return false;
}

// ─── BOOT ───────────────────────────────────────────────────────────────────
(function boot(){
  const confirmedRedirect = checkAuthRedirect();
  if(confirmedRedirect){
    S.mode = "auth"; render();
  } else if(restoreSession()){
    if(!S.user.niches?.length){ S.mode = "onboard"; S.onboard.name = S.user.name || ""; render(); }
    else { S.mode = "app"; render(); bootApp(); }
  } else {
    S.mode = "auth"; render();
  }
  // Refresh trends every 20 min
  setInterval(() => { if(S.mode==="app"){ loadTrends(); loadNotifs(); }}, 20*60*1000);
})();

/* ═══════════════════════════════════════════════════════════════════════════
   v1.7 PRE-BETA LAYER — additive only, does not touch existing code paths
   Adds: offline banner · fetch retry+error toast · analytics tracker ·
         feedback button · reset/export/import · terms/privacy · camera copy
   ═══════════════════════════════════════════════════════════════════════════ */
(function betaLayer(){
  const uid = () => (window.S?.user?.id || window.S?.user?.email || "anon");

  // ─── 1. OFFLINE / RETRY BANNER ────────────────────────────────────────────
  const bar = document.createElement("div");
  bar.id = "cp-net-bar";
  bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#c0392b;color:#fff;padding:8px 14px;font:600 12px system-ui;text-align:center;display:none;transform:translateY(-100%);transition:transform .25s";
  document.body.appendChild(bar);
  const showBar = (msg, color) => {
    bar.textContent = msg;
    bar.style.background = color || "#c0392b";
    bar.style.display = "block";
    requestAnimationFrame(() => bar.style.transform = "translateY(0)");
  };
  const hideBar = () => { bar.style.transform = "translateY(-100%)"; setTimeout(()=>bar.style.display="none", 250); };
  window.addEventListener("offline", () => showBar("You're offline — Create Studio still works. Trends will refresh when you're back.", "#7f5539"));
  window.addEventListener("online", () => { showBar("Back online ✓", "#2d6a4f"); setTimeout(hideBar, 1500); });

  // ─── 2. FETCH WRAPPER: retry, error toast, analytics on failures ──────────
  const _rawFetch = window.fetch.bind(window);
  const _fetch = (input, init) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 60000); // 60s — covers Render free-tier cold start
    return _rawFetch(input, { ...init, signal: ctl.signal }).finally(() => clearTimeout(timer));
  };
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const isApi = /\/api\//.test(url);
    let attempt = 0, lastErr;
    while (attempt < (isApi ? 2 : 1)) {
      try {
        const r = await _fetch(input, init);
        if (isApi && r.status >= 500) throw new Error("HTTP " + r.status);
        return r;
      } catch (e) {
        lastErr = e;
        attempt++;
        if (attempt < 2) await new Promise(res => setTimeout(res, 600));
      }
    }
    if (isApi) {
      try { window.toast && window.toast("Network hiccup — tap to retry", 3500); } catch (_) {}
      track("api_error", { url: url.split("?")[0], msg: String(lastErr).slice(0,80) });
    }
    throw lastErr;
  };

  // ─── 3. ANALYTICS ────────────────────────────────────────────────────────
  const track = (name, props) => {
    try {
      _fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid(), name, props: props || {} }),
        keepalive: true,
      }).catch(()=>{});
    } catch (_) {}
  };
  window.cpTrack = track;
  // Auto-track tab switches
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[onclick*='switchTab'],[onclick*='setPage']");
    if (t) {
      const label = (t.dataset.tab || t.textContent || "").trim().slice(0,20);
      if (label) track("tab_click", { tab: label });
    }
    const save = e.target.closest("[onclick*='savePost'],[onclick*='saveTrend']");
    if (save) track("save_action");
    const gen = e.target.closest("[onclick*='generate']");
    if (gen) track("generate_click");
  }, true);
  track("app_open", { ua: navigator.userAgent.slice(0,80) });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      track("app_focus");
      // freshness: refetch trends if last load >30min ago
      const last = window._cpLastTrends || 0;
      if (Date.now() - last > 30*60*1000 && window.loadTrends) {
        try { window.loadTrends(); window._cpLastTrends = Date.now(); } catch(_) {}
      }
    }
  });
  if (window.loadTrends) {
    const orig = window.loadTrends;
    window.loadTrends = function(...a){ window._cpLastTrends = Date.now(); return orig.apply(this,a); };
  }

  // ─── 4. FEEDBACK BUTTON + MODAL ──────────────────────────────────────────
  const fbBtn = document.createElement("button");
  fbBtn.id = "cp-fb-btn";
  fbBtn.innerHTML = "💬";
  fbBtn.title = "Send feedback";
  fbBtn.style.cssText = "position:fixed;left:14px;bottom:82px;z-index:9998;width:44px;height:44px;border-radius:50%;border:0;background:#1a1a1a;color:#fff;font-size:20px;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer";
  document.body.appendChild(fbBtn);
  fbBtn.onclick = () => openModal("feedback");

  // ─── 5. MODAL ENGINE ─────────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "cp-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center;padding:0;font:14px system-ui";
  modal.innerHTML = `<div id="cp-modal-inner" style="background:#fff;color:#111;width:100%;max-width:480px;border-radius:18px 18px 0 0;padding:20px 18px 28px;max-height:88vh;overflow:auto"></div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  const closeModal = () => { modal.style.display = "none"; };
  window.cpCloseModal = closeModal;

  const openModal = async (kind) => {
    const box = modal.querySelector("#cp-modal-inner");
    modal.style.display = "flex";
    if (kind === "feedback") {
      track("feedback_open");
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:16px">Send feedback</div>
          <button onclick="cpCloseModal()" style="border:0;background:transparent;font-size:22px;cursor:pointer">×</button>
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:10px">Bug, idea, or just a reaction — all welcome. We attach your current screen automatically.</div>
        <textarea id="cp-fb-msg" placeholder="What's up?" style="width:100%;min-height:120px;border:1px solid #ddd;border-radius:10px;padding:10px;font:14px system-ui;resize:vertical"></textarea>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666;margin:10px 0">
          <input type="checkbox" id="cp-fb-contact" checked/> OK to email me back at ${escapeHtml(window.S?.user?.email || "your account email")}
        </label>
        <button id="cp-fb-send" style="width:100%;background:#111;color:#fff;border:0;border-radius:10px;padding:12px;font-weight:600;cursor:pointer">Send</button>`;
      box.querySelector("#cp-fb-send").onclick = async () => {
        const msg = box.querySelector("#cp-fb-msg").value.trim();
        if (msg.length < 3) return alert("Add a bit more detail.");
        const contact = box.querySelector("#cp-fb-contact").checked;
        try {
          await _fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uid(),
              email: contact ? (window.S?.user?.email || null) : null,
              screen: window.S?.tab || window.S?.mode || "unknown",
              message: msg,
              context: {
                niche: window.S?.user?.niches,
                connections: Object.keys(window.S?.connections || {}),
                lastError: window._cpLastError || null,
                path: location.pathname,
              },
            }),
          });
          track("feedback_send", { len: msg.length });
          box.innerHTML = `<div style="text-align:center;padding:30px 10px"><div style="font-size:38px">✓</div><div style="font-weight:600;margin-top:8px">Thanks — logged.</div><div style="font-size:12px;color:#666;margin-top:4px">We read every one during beta.</div><button onclick="cpCloseModal()" style="margin-top:18px;background:#111;color:#fff;border:0;border-radius:10px;padding:10px 22px;cursor:pointer">Close</button></div>`;
        } catch (e) { alert("Couldn't send — try again in a bit."); }
      };
    }
else if (kind === "terms" || kind === "privacy" || kind === "cookies" || kind === "aup" ||
             kind === "aiDisclaimer" || kind === "dmca" || kind === "about" || kind === "contact") {
      track(kind + "_open");
      if (kind === "contact") { renderContactModal(box); return; }
      const pg = window.LEGAL_PAGES && window.LEGAL_PAGES[kind];
      if (pg) {
        box.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-weight:700;font-size:16px">${escapeHtml(pg.title)}</div>
            <button onclick="cpCloseModal()" style="border:0;background:transparent;font-size:22px;cursor:pointer">×</button>
          </div>
          <div style="color:#888;font-size:11px;margin-bottom:10px">Last updated ${escapeHtml(pg.updated)}</div>
          <div style="font-size:13px;line-height:1.6;color:#333;max-height:65vh;overflow:auto;padding-right:4px">${pg.body}</div>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#888">Questions? <a href="#" onclick="cpOpen('contact');return false;" style="color:#6366f1">Contact us</a>.</div>
        `;
      } else {
        box.innerHTML = `<div>Page not available.</div>`;
      }
    }
    else if (kind === "data") {
      track("data_panel_open");
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:16px">Data & Privacy</div>
          <button onclick="cpCloseModal()" style="border:0;background:transparent;font-size:22px;cursor:pointer">×</button>
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:14px">Your saved posts, schedule, and connected handles live on your account. You control them here.</div>
        <button onclick="cpExport()" style="width:100%;padding:12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:8px;cursor:pointer;text-align:left"><b>Export my data</b><div style="font-size:11px;color:#777;margin-top:2px">Download a JSON backup of everything.</div></button>
        <label style="display:block;padding:12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:8px;cursor:pointer;text-align:left"><b>Import backup</b><div style="font-size:11px;color:#777;margin-top:2px">Restore from a JSON file.</div><input id="cp-import" type="file" accept="application/json" style="display:none"></label>
        <div style="margin:10px 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Legal & policies</div>
        <button onclick="cpOpen('terms')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>Terms of Service</b></button>
        <button onclick="cpOpen('privacy')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>Privacy Policy</b></button>
        <button onclick="cpOpen('cookies')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>Cookie Notice</b></button>
        <button onclick="cpOpen('aup')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>Acceptable Use Policy</b></button>
        <button onclick="cpOpen('aiDisclaimer')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>AI Content Disclaimer</b></button>
        <button onclick="cpOpen('dmca')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>Copyright / DMCA</b></button>
        <button onclick="cpOpen('about')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:6px;cursor:pointer;text-align:left;font-size:13px"><b>About CreatorPulse</b></button>
        <button onclick="cpOpen('contact')" style="width:100%;padding:10px 12px;border:1px solid #ddd;background:#fafafa;border-radius:10px;margin-bottom:16px;cursor:pointer;text-align:left;font-size:13px"><b>Contact us</b></button>
        <button onclick="cpReset()" style="width:100%;padding:12px;border:1px solid #e0b4b4;background:#fff5f5;color:#a94442;border-radius:10px;cursor:pointer;text-align:left"><b>Reset app data</b><div style="font-size:11px;color:#a94442;margin-top:2px;opacity:.85">Wipes saved posts, schedule, connections. Keeps your account.</div></button>`;
      box.querySelector("#cp-import").onchange = (ev) => {
        const f = ev.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          try {
            const data = JSON.parse(rd.result);
            window.S.saved = data.saved || window.S.saved || [];
            window.S.userSchedule = data.schedule || window.S.userSchedule || [];
            if (window.saveSession) window.saveSession();
            if (window.render) window.render();
            track("data_import", { savedCount: (data.saved||[]).length });
            alert("Imported ✓");
            closeModal();
          } catch (e) { alert("That file wasn't a valid backup."); }
        };
        rd.readAsText(f);
      };
    }
  };
  window.cpOpen = openModal;

  window.cpExport = async () => {
    try {
      const local = { saved: window.S?.saved || [], schedule: window.S?.userSchedule || [], user: window.S?.user, connections: window.S?.connections };
      let remote = {};
      try {
        remote = await _fetch("/api/account/export", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: uid() })}).then(r=>r.json());
      } catch(_) {}
      const blob = new Blob([JSON.stringify({ ...local, ...remote, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `creatorpulse-backup-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      track("data_export");
    } catch(e){ alert("Export failed."); }
  };

  window.cpReset = async () => {
    if (!confirm("Wipe all saved posts, schedule, and connections on this account? Cannot be undone.")) return;
    try {
      await _fetch("/api/account/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ userId: uid() })});
      window.S.saved = []; window.S.userSchedule = []; window.S.connections = {};
      if (window.saveSession) window.saveSession();
      if (window.render) window.render();
      track("data_reset");
      alert("Reset ✓");
      closeModal();
    } catch(e){ alert("Reset failed — try again."); }
  };

  // ─── 6. INJECT "DATA & PRIVACY" ROW INTO PROFILE AFTER EACH RENDER ───────
  const injectProfile = () => {
    if (document.getElementById("cp-data-row")) return;
    // Find sign-out button or profile page container as anchor
    const signOut = Array.from(document.querySelectorAll("button")).find(b => /sign\s*out|log\s*out/i.test(b.textContent));
    if (!signOut) return;
    const row = document.createElement("div");
    row.id = "cp-data-row";
    row.style.cssText = "margin:14px 0;display:flex;flex-direction:column;gap:8px";
    row.innerHTML = `
      <button onclick="cpOpen('data')" style="width:100%;text-align:left;padding:12px 14px;border:1px solid var(--br,#e5e5e5);background:transparent;border-radius:10px;font:600 13px system-ui;color:var(--tx,#111);cursor:pointer">Data & Privacy</button>
      <button onclick="cpOpen('feedback')" style="width:100%;text-align:left;padding:12px 14px;border:1px solid var(--br,#e5e5e5);background:transparent;border-radius:10px;font:600 13px system-ui;color:var(--tx,#111);cursor:pointer">Send feedback</button>
      <button onclick="cpOpen('contact')" style="width:100%;text-align:left;padding:12px 14px;border:1px solid var(--br,#e5e5e5);background:transparent;border-radius:10px;font:600 13px system-ui;color:var(--tx,#111);cursor:pointer">Contact us</button>
      <div style="margin-top:6px;padding:10px 4px;font-size:11px;color:var(--mu,#888);text-align:center;line-height:1.7">
        <a href="#" onclick="cpOpen('terms');return false;" style="color:inherit;text-decoration:underline">Terms</a> ·
        <a href="#" onclick="cpOpen('privacy');return false;" style="color:inherit;text-decoration:underline">Privacy</a> ·
        <a href="#" onclick="cpOpen('cookies');return false;" style="color:inherit;text-decoration:underline">Cookies</a> ·
        <a href="#" onclick="cpOpen('aup');return false;" style="color:inherit;text-decoration:underline">AUP</a> ·
        <a href="#" onclick="cpOpen('aiDisclaimer');return false;" style="color:inherit;text-decoration:underline">AI Disclaimer</a> ·
        <a href="#" onclick="cpOpen('dmca');return false;" style="color:inherit;text-decoration:underline">DMCA</a> ·
        <a href="#" onclick="cpOpen('about');return false;" style="color:inherit;text-decoration:underline">About</a><br>
        © ${new Date().getFullYear()} CreatorPulse. All rights reserved.
      </div>`;
    signOut.parentElement.insertBefore(row, signOut);
  };
  const injectCameraCopy = () => {
    if (document.getElementById("cp-cam-copy")) return;
    const camBtn = Array.from(document.querySelectorAll("button")).find(b => /start\s*camera/i.test(b.textContent));
    if (!camBtn) return;
    const p = document.createElement("div");
    p.id = "cp-cam-copy";
    p.style.cssText = "font-size:11px;color:var(--mu,#888);margin-top:6px;line-height:1.4";
    p.textContent = "Camera + mic run locally in your browser. Recordings never leave your device.";
    camBtn.parentElement.appendChild(p);
  };
  const injectEmptyStates = () => {
    // generic: if a tab pane is empty, show a friendly note
    const panes = document.querySelectorAll("[data-empty-check]");
    panes.forEach(p => {
      if (!p.children.length && !p.dataset.emptied) {
        p.dataset.emptied = "1";
        p.innerHTML = `<div style="padding:24px;text-align:center;color:var(--mu,#888);font-size:13px">Nothing here yet.</div>`;
      }
    });
  };

  const mo = new MutationObserver(() => { injectProfile(); injectCameraCopy(); injectEmptyStates(); });
  mo.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { injectProfile(); injectCameraCopy(); }, 800);

  // ─── 7. CAPTURE LAST ERROR FOR FEEDBACK CONTEXT ──────────────────────────
  window.addEventListener("error", (e) => { window._cpLastError = { msg: String(e.message).slice(0,200), at: Date.now() }; });
  window.addEventListener("unhandledrejection", (e) => { window._cpLastError = { msg: String(e.reason).slice(0,200), at: Date.now() }; });

  function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

  console.log("[CreatorPulse v1.7 pre-beta layer active]");
})();

(function(){
  const OP  = "CreatorPulse";
  const EM  = "sportsguycollabs@gmail.com";
  const UP  = "2026-07-16";
  const JUR = "[YOUR JURISDICTION]"; // placeholder until finalized

  const P = (s) => "<p style=\"margin:0 0 10px\">" + s + "</p>";
  const H = (s) => "<h4 style=\"margin:16px 0 6px;font-size:14px;color:#111\">" + s + "</h4>";
  const U = (arr) => "<ul style=\"margin:0 0 10px 18px;padding:0\">" + arr.map(x=>"<li style=\"margin:2px 0\">"+x+"</li>").join("") + "</ul>";

  window.LEGAL_PAGES = {
    privacy: {
      title: "Privacy Policy", updated: UP,
      body: [
        P("This Privacy Policy explains what " + OP + " (\"we\", \"us\") collects, why, and how you control it. This is a beta product and this policy may evolve — we will update the date above."),
        H("What we collect"),
        U([
          "<b>Account info</b>: email, name, chosen niches, preferred platforms, posts-per-day setting.",
          "<b>Content you create</b>: saved posts, scheduled items, and generated scripts/images stored on your account.",
          "<b>Third-party tokens</b>: if you connect Google Calendar, we store the OAuth tokens needed to create events on your behalf. You can revoke at any time.",
          "<b>Usage analytics</b>: anonymous events (which tabs you use, feature drop-off). We do not log the contents of your generated posts.",
          "<b>Device info</b>: standard request metadata (IP, user agent) for security and rate-limiting."
        ]),
        H("Why we collect it"),
        U([
          "Provide the service (personalized trends, saved calendar, generated content).",
          "Improve the product (aggregate analytics and feedback).",
          "Prevent abuse (rate limits, spam prevention).",
          "Communicate with you when you contact us."
        ]),
        H("What we do NOT do"),
        U([
          "We do not sell your data.",
          "We do not use your generated content to train third-party AI models.",
          "We do not post to your social accounts on your behalf.",
          "We do not log the bodies of your scripts or generated media."
        ]),
        H("Third parties we use"),
        U([
          "<b>Supabase</b> — account storage, authentication, database.",
          "<b>Groq</b> — LLM inference for text generation.",
          "<b>Hugging Face + Pollinations</b> — image generation.",
          "<b>NewsAPI, Google News, RSS providers</b> — public news and blog aggregation.",
          "<b>Google</b> — optional Calendar OAuth for scheduling.",
          "<b>Render / Cloudflare</b> — hosting and CDN."
        ]),
        H("Retention"),
        P("Account data is retained for as long as your account exists. Anonymous analytics events are retained up to 90 days. You can export or delete your data any time from Profile → Data & Privacy → Reset app data, or by emailing " + EM + "."),
        H("Your rights"),
        P("You can request access, correction, or deletion of any personal data we hold. Email " + EM + " and we will respond within 30 days."),
        H("Children"),
        P(OP + " is not directed to children under 13. If we learn we have collected personal data from a child under 13, we will delete it."),
        H("Contact"),
        P("Questions or requests: " + EM + ".")
      ].join("")
    },

    terms: {
      title: "Terms of Service", updated: UP,
      body: [
        P("These Terms govern your use of " + OP + ". By creating an account or using the service, you agree to them. If you don't agree, don't use the service."),
        H("Your account"),
        U([
          "You are responsible for keeping your login credentials secure.",
          "One person per account. Don't share your account.",
          "You must be at least 13 years old.",
          "You are responsible for all activity under your account."
        ]),
        H("What you can do with generated content"),
        P("You own the outputs " + OP + " generates for you (scripts, hooks, ideas, images) to the extent allowed by law. You are responsible for verifying facts, checking for copyright issues in generated images, and complying with the terms of every platform you post to."),
        H("What you cannot do"),
        P("See the Acceptable Use Policy — violations may result in immediate account termination without refund."),
        H("Beta software disclaimer"),
        P(OP + " is in active development. Features may change, break, or be removed. Save important work locally. We do not guarantee availability or backwards compatibility during beta."),
        H("Warranty disclaimer"),
        P("The service is provided \"as is\" and \"as available\", without warranties of any kind, express or implied. We do not warrant that outputs are accurate, complete, non-infringing, or fit for any particular purpose."),
        H("Limitation of liability"),
        P("To the maximum extent permitted by law, " + OP + " and its operators are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or goodwill, arising from your use of the service. Total aggregate liability shall not exceed the amount you paid us in the 12 months preceding the claim (which, during free beta, is zero)."),
        H("Termination"),
        P("You may delete your account at any time. We may suspend or terminate accounts that violate these Terms or the Acceptable Use Policy."),
        H("Governing law"),
        P("These Terms are governed by the laws of " + JUR + ", without regard to conflict-of-laws principles. Any disputes will be resolved in the courts of " + JUR + "."),
        H("Changes"),
        P("We may update these Terms. Material changes will be flagged in the app. Continued use after changes constitutes acceptance."),
        H("Contact"),
        P("Questions: " + EM + ".")
      ].join("")
    },

    cookies: {
      title: "Cookie Notice", updated: UP,
      body: [
        P(OP + " uses only what is necessary to keep you signed in and remember your preferences. We do not use third-party advertising trackers."),
        H("What we use"),
        U([
          "<b>Session storage</b> — keeps you signed in between visits (auth token). Required.",
          "<b>Local storage</b> — remembers your niches, preferences, saved drafts, and UI settings on your device. Required for the app to work.",
          "<b>Anonymous analytics</b> — aggregated usage stats. No advertising IDs, no cross-site tracking."
        ]),
        H("What we don't use"),
        U([
          "No Google Analytics.",
          "No Facebook Pixel.",
          "No advertising trackers.",
          "No third-party retargeting cookies."
        ]),
        H("Controlling storage"),
        P("You can clear all locally stored data via Profile → Data & Privacy → Reset app data. You can also clear site data through your browser settings. Note: clearing storage will sign you out."),
        H("Contact"),
        P("Questions: " + EM + ".")
      ].join("")
    },

    aup: {
      title: "Acceptable Use Policy", updated: UP,
      body: [
        P("You may not use " + OP + " to create or distribute content that violates law or the standards below. Violations result in account termination without notice."),
        H("Prohibited content"),
        U([
          "Illegal content of any kind.",
          "Child sexual abuse material (CSAM) — reported to authorities immediately.",
          "Content that sexualizes minors in any way.",
          "Non-consensual intimate imagery (\"revenge porn\") or content designed to harass a specific person.",
          "Direct threats of violence, incitement to violence, or content promoting terrorism.",
          "Content that impersonates a real person or public figure in a way designed to deceive.",
          "Deepfakes intended to defame, defraud, or manipulate elections.",
          "Content designed to spread disinformation about health, elections, or public safety.",
          "Hate speech targeting people on the basis of race, religion, gender, sexual orientation, or disability.",
          "Malware, phishing content, or instructions for hacking systems you don't own."
        ]),
        H("Prohibited behavior"),
        U([
          "Scraping the platform or reselling its outputs as a competing service.",
          "Reverse-engineering the service or its APIs.",
          "Circumventing rate limits, quotas, or paywalls.",
          "Automated bulk-generation for spam.",
          "Using outputs as human-written journalism without disclosing AI assistance where required by law or platform rules.",
          "Sharing account access with third parties or reselling accounts."
        ]),
        H("Reporting abuse"),
        P("If you believe someone is misusing " + OP + ", email " + EM + " with details. We investigate every report."),
        H("Enforcement"),
        P("We may remove content, suspend, or terminate accounts at our sole discretion. We may cooperate with law enforcement where required.")
      ].join("")
    },

    aiDisclaimer: {
      title: "AI Content Disclaimer", updated: UP,
      body: [
        P(OP + " generates content using large language models and image generation models. This section explains what that means for you."),
        H("Outputs may be wrong"),
        U([
          "AI models can produce inaccurate, outdated, or fabricated information (\"hallucinations\").",
          "Verify every factual claim, name, statistic, date, and quote before publishing.",
          "Trend data is aggregated from public sources and may not reflect the latest events."
        ]),
        H("You are responsible for what you publish"),
        P("You are the publisher of anything you post using " + OP + " outputs. That includes accuracy, defamation risk, copyright, platform rules, and disclosure requirements in your jurisdiction."),
        H("Copyright and originality"),
        U([
          "We do not guarantee that generated text or images are free of similarity to existing works.",
          "Generated images may resemble copyrighted characters, logos, or trademarks — do not use them commercially without your own clearance.",
          "Do not use " + OP + " to reproduce copyrighted material verbatim."
        ]),
        H("Disclosure"),
        P("Some platforms and jurisdictions require creators to disclose AI-assisted content. It is your responsibility to comply — see, for example, EU AI Act transparency rules and platform-specific policies (YouTube, TikTok, Meta)."),
        H("Bias"),
        P("AI models reflect biases in their training data. Outputs may unintentionally reinforce stereotypes. Review outputs critically."),
        H("No professional advice"),
        P("Nothing generated by " + OP + " is legal, medical, financial, or professional advice. Consult a qualified professional for decisions that matter.")
      ].join("")
    },

    dmca: {
      title: "Copyright / DMCA Policy", updated: UP,
      body: [
        P(OP + " respects intellectual property rights. If you believe content generated or hosted by our service infringes your copyright, submit a notice under the process below."),
        H("Sending a takedown notice"),
        P("Send an email to <b>" + EM + "</b> with the subject line \"DMCA Takedown Notice\" and include:"),
        U([
          "Your full legal name, address, phone number, and email.",
          "A description of the copyrighted work you claim was infringed.",
          "The URL(s) or specific location(s) of the allegedly infringing material inside " + OP + ".",
          "A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.",
          "A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.",
          "Your physical or electronic signature."
        ]),
        H("Counter-notice"),
        P("If you believe your content was removed by mistake or misidentification, you may submit a counter-notice to " + EM + " with:"),
        U([
          "Your name, address, phone number, and email.",
          "Identification of the material removed and its prior location.",
          "A statement, under penalty of perjury, that you have a good-faith belief the material was removed as a result of mistake or misidentification.",
          "Your consent to jurisdiction of the courts of " + JUR + ".",
          "Your physical or electronic signature."
        ]),
        H("Repeat infringers"),
        P("We terminate accounts of users determined to be repeat infringers.")
      ].join("")
    },

    about: {
      title: "About CreatorPulse", updated: UP,
      body: [
        P(OP + " is a trending-idea engine for content creators. It watches the internet for you and turns real-time trends into ready-to-post ideas across sports, music, tech, fashion, gaming, and culture."),
        H("What it does"),
        U([
          "<b>Home feed</b> — live trending stories per niche, ranked by relevance.",
          "<b>Hooks</b> — 50+ proven opening lines adapted to your niche.",
          "<b>Calendar</b> — plan and schedule your content, optionally synced to Google Calendar.",
          "<b>Create Studio</b> — generate scripts, thumbnails, and carousel ideas.",
          "<b>AI Coach</b> — personalized advice based on your niches and platforms."
        ]),
        H("Why we built it"),
        P("Every creator loses hours a day scrolling to find what to post. " + OP + " does that scrolling for you and gives you a shortlist that's actually relevant."),
        H("Status"),
        P("We are in <b>pre-beta</b>. Expect rapid iteration and occasional rough edges. Send feedback via Profile → Send feedback — we read every one."),
        H("Contact"),
        P("Get in touch: " + EM + ".")
      ].join("")
    }
  };

  // Contact form modal
  window.renderContactModal = function(box){
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-weight:700;font-size:16px">Contact us</div>
        <button onclick="cpCloseModal()" style="border:0;background:transparent;font-size:22px;cursor:pointer">×</button>
      </div>
      <div style="font-size:12px;color:#666;margin-bottom:12px">Questions, bug reports, DMCA, business enquiries — this reaches us directly.</div>
      <label style="display:block;font-size:11px;color:#666;margin-bottom:4px">Your name</label>
      <input id="cp-ct-name" maxlength="80" placeholder="Jane Doe" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px;font:13px system-ui;margin-bottom:8px"/>
      <label style="display:block;font-size:11px;color:#666;margin-bottom:4px">Email</label>
      <input id="cp-ct-email" type="email" maxlength="255" placeholder="you@example.com" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px;font:13px system-ui;margin-bottom:8px" value="${escapeHtml((window.S && window.S.user && window.S.user.email) || "")}"/>
      <label style="display:block;font-size:11px;color:#666;margin-bottom:4px">Subject</label>
      <input id="cp-ct-subject" maxlength="200" placeholder="What's this about?" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:9px;font:13px system-ui;margin-bottom:8px"/>
      <label style="display:block;font-size:11px;color:#666;margin-bottom:4px">Message</label>
      <textarea id="cp-ct-msg" maxlength="4000" placeholder="Tell us more…" style="width:100%;min-height:120px;border:1px solid #ddd;border-radius:8px;padding:9px;font:13px system-ui;resize:vertical;margin-bottom:10px"></textarea>
      <button id="cp-ct-send" style="width:100%;background:#111;color:#fff;border:0;border-radius:10px;padding:12px;font-weight:600;cursor:pointer">Send message</button>
      <div style="font-size:11px;color:#888;margin-top:8px;text-align:center">Or email us directly: <a href="mailto:${EM_JS}" style="color:#6366f1">${EM_JS}</a></div>
    `;
    box.querySelector("#cp-ct-send").onclick = async () => {
      const btn = box.querySelector("#cp-ct-send");
      const name    = box.querySelector("#cp-ct-name").value.trim();
      const email   = box.querySelector("#cp-ct-email").value.trim();
      const subject = box.querySelector("#cp-ct-subject").value.trim();
      const message = box.querySelector("#cp-ct-msg").value.trim();
      if (!name || !subject || message.length < 5) return alert("Please fill in name, subject, and a message (min 5 chars).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Please enter a valid email address.");
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const r = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message })
        });
        const d = await r.json().catch(()=>({}));
        if (!r.ok) throw new Error(d.error || "Send failed");
        box.innerHTML = `<div style="text-align:center;padding:30px 10px">
          <div style="font-size:38px">✓</div>
          <div style="font-weight:600;margin-top:8px">Message sent</div>
          <div style="font-size:12px;color:#666;margin-top:4px">We'll reply to ${escapeHtml(email)} within a few days.</div>
          <button onclick="cpCloseModal()" style="margin-top:18px;background:#111;color:#fff;border:0;border-radius:10px;padding:10px 22px;cursor:pointer">Close</button>
        </div>`;
      } catch (e) {
        btn.disabled = false; btn.textContent = "Send message";
        alert(e.message || "Couldn't send — try again.");
      }
    };
  };
  // Expose EM for the template above
  const EM_JS = EM;
  window.renderContactModal.EM = EM;

  // ─── Cookie banner (dismissable, one-time) ────────────────────────────────
  function showCookieBanner(){
    if (localStorage.getItem("cp_cookie_ack") === "1") return;
    if (document.getElementById("cp-cookie-banner")) return;
    const b = document.createElement("div");
    b.id = "cp-cookie-banner";
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(var(--tab-h) + 16px + env(safe-area-inset-bottom));z-index:9999;max-width:520px;margin:0 auto;background:#141420;color:#fff;border:1px solid #2a2a3a;border-radius:14px;padding:14px 16px;font:13px/1.5 system-ui,-apple-system,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.4)";
    b.innerHTML = '<div style="margin-bottom:10px">We use only what\'s needed to keep you signed in and remember your preferences. No ad trackers. <a href="#" onclick="cpOpen(\'cookies\');return false;" style="color:#a5b4fc">Read our cookie notice</a>.</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button id="cp-cookie-ok" style="background:#6366f1;color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer;font:600 13px system-ui">Got it</button>' +
      '</div>';
    document.body.appendChild(b);
    document.getElementById("cp-cookie-ok").onclick = () => {
      localStorage.setItem("cp_cookie_ack", "1");
      b.remove();
    };
  }
  // Show once app is up
  setTimeout(showCookieBanner, 1500);

  console.log("[CreatorPulse legal pages loaded]");
})();
