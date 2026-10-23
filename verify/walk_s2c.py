"""Walk the story -> Create handoff (spec 3.2) in real Chromium at iPhone size.

Proves, against the running app:
  1. the "Create content" button renders on an expanded story card
  2. tapping it lands on the Create tab, seeded (not on an empty step 1)
  3. the carried platform matches what the card was showing
  4. the flow can actually continue from where it landed
  5. no uncaught console errors
  6. every other tab still renders afterwards
"""
import asyncio, json, os
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:4400")
OUT = os.environ.get("OUT", "/workspace/cp_s2c_shots")
os.makedirs(OUT, exist_ok=True)

SEED = {
    "token": "seeded-token-for-visual-walkthrough",
    "refreshToken": None,
    "user": {
        "name": "Alex Rivera",
        "handle": "alexrivera",
        "email": "alex@example.com",
        "niches": ["WWE Wrestling", "Basketball"],
        "platforms": ["instagram", "tiktok", "youtube", "twitter"],
        "primaryPlatform": "instagram",
        "postsPerDay": 3,
    },
    "connections": {},
}


async def main():
    errors = []
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await b.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True, has_touch=True,
            service_workers="block",
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                       "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        await ctx.add_init_script(
            "try{localStorage.setItem('cp_v2', JSON.stringify(%s));}catch(e){}" % json.dumps(SEED)
        )
        pg = await ctx.new_page()
        pg.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))

        await pg.goto(BASE, wait_until="domcontentloaded", timeout=60000)
        # The app boots asynchronously (auth, saved posts, feeds). Poll for its
        # state object rather than guessing with a fixed sleep — a short sleep
        # made this walk fail intermittently with "S is not defined".
        # (wait_for_function is unusable here: the page's Content-Security-Policy
        # forbids eval, which is how Playwright injects its predicate.)
        ready = False
        for _ in range(90):
            try:
                ready = await pg.evaluate(
                    "() => { try { return typeof S !== 'undefined' && !!S && Array.isArray(S.trends); } catch(e){ return false; } }"
                )
            except Exception:
                ready = False
            if ready:
                break
            await pg.wait_for_timeout(500)
        res["app_ready"] = ready
        if not ready:
            res["fatal"] = "app never exposed S.trends"
            res["uncaught_errors"] = errors
            print(json.dumps(res, indent=2))
            await b.close()
            return
        await pg.wait_for_timeout(2500)

        # ── fixture ───────────────────────────────────────────────────────────
        # This sandbox has NO live news key (see /api/health: newsapi:false,
        # currents:false), so the real feed arrives empty and there is no story
        # card to tap. We therefore put two realistically-shaped stories into
        # the app's OWN state object (bare `S`, a top-level const in core.js)
        # and then drive the real toggle() -> render() -> button path. Nothing
        # in the shipped app is mocked; only this test browser's data is.
        seeded = await pg.evaluate("""() => {
            if (typeof S === 'undefined') return {ok:false, why:'S not reachable'};
            const now = Date.now();
            S.trends = [
              { id:'fx1', headline:'WWE star stuns the crowd with a record comeback',
                summary:'A record night for the promotion, with three title changes.',
                niche:'WWE Wrestling', image:null, score:82, timestamp: now - 3600*1000,
                source:'Fixture Feed', tags:['wrestling','record'], viralTier:'trending' },
              { id:'fx2', headline:'Basketball trade shakes up the playoff race',
                summary:'Stats point to a record season.', niche:'Basketball', image:null,
                score:71, timestamp: now - 7200*1000, source:'Fixture Feed',
                tags:['nba'], viralTier:'mid' }
            ];
            if (typeof render === 'function') render();
            return {ok:true, n:S.trends.length};
        }""")
        res["fixture"] = seeded
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f"{OUT}/00-home.png")

        # ── expand the first story ────────────────────────────────────────────
        opened = await pg.evaluate("""() => {
            const id = S.trends[0].id;
            if (typeof window.toggle === 'function') window.toggle(id);
            return {ok:true, id, headline: S.trends[0].headline};
        }""")
        res["opened_story"] = opened
        if not opened.get("ok"):
            res["fatal"] = "no stories loaded in this sandbox"
            res["errors"] = errors
            print(json.dumps(res, indent=2))
            await b.close()
            return

        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f"{OUT}/01-story-expanded.png")

        # ── the new button exists and is a practical size ─────────────────────
        cta = await pg.evaluate("""() => {
            const b = document.querySelector('.cp-create-cta');
            if (!b) return {found:false};
            const r = b.getBoundingClientRect();
            return {found:true, text:(b.innerText||'').trim(),
                    w:Math.round(r.width), h:Math.round(r.height),
                    visible: r.width>0 && r.height>0,
                    onclick: b.getAttribute('onclick')};
        }""")
        res["cta"] = cta

        # what the card was showing, so we can prove it was carried
        card_state = await pg.evaluate("""() => {
            const id = S.trends[0].id;
            return {platform:(S.plat&&S.plat[id])||null, format:(S.ctype&&S.ctype[id])||null,
                    platform_row: (document.querySelector('.best-plat-val')||{}).innerText||null};
        }""")
        res["card_state"] = card_state

        # ── tap it (a real touch, not a JS call) ──────────────────────────────
        tapped = False
        try:
            await pg.locator(".cp-create-cta").first.tap(timeout=5000)
            tapped = True
        except Exception as e:
            res["tap_error"] = str(e)[:200]
        if not tapped:
            await pg.evaluate("() => { const b=document.querySelector('.cp-create-cta'); if(b) b.click(); }")
            res["tap_fallback_click"] = True
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f"{OUT}/02-create-seeded.png")

        # ── what did we land on? ──────────────────────────────────────────────
        landed = await pg.evaluate("""() => {
            const st = (window.CPCreate && window.CPCreate.cs) ? window.CPCreate.cs() : null;
            return {
                tab: (typeof S !== 'undefined' && S.tab) || null,
                step: st && st.step,
                platform: st && st.platform,
                format: st && st.format,
                source: st && st.source,
                sourceRef: st && st.sourceRef ? (st.sourceRef.headline || st.sourceRef.title) : null,
                heading: (document.querySelector('.cc-h1')||{}).innerText || null,
                rails: Array.from(document.querySelectorAll('.cc-rail')).map(r=>r.innerText.replace(/\\s+/g,' ').trim()),
                can_next: !!(document.querySelector('.cc-next') && !document.querySelector('.cc-next').disabled)
            };
        }""")
        res["landed"] = landed

        # A real regression check the walk can make and the unit tests cannot:
        # does the platform that ARRIVED in Create match the one the card was
        # actually DISPLAYING next to "Best platform"? That is the user-visible
        # promise — S.plat[tid] holds an untapped default, so comparing against
        # it would test the wrong thing.
        row = (card_state.get("platform_row") or "").strip().lower()
        row_as_id = {"x (twitter)": "twitter", "x": "twitter"}.get(row, row)
        res["carried_matches_card"] = (landed.get("platform") == row_as_id) if row else None

        # ── can the flow actually continue from here? ─────────────────────────
        cont = await pg.evaluate("""() => {
            const st = (window.CPCreate && window.CPCreate.cs) ? window.CPCreate.cs() : null;
            const f = window.CPCreateFlow;
            const pt = window.CPEnv.ptypes();
            if (!st || !f) return {ok:false};
            // The step we needed to be past, and whether the flow agrees it is valid.
            return {step: st.step,
                    platform_ok: !!st.platform && !!pt[st.platform],
                    format_ok: !!st.format && (pt[st.platform]||[]).indexOf(st.format) >= 0,
                    format_belongs: (pt[st.platform]||[]).slice(0,6)};
        }""")
        res["continue_check"] = cont

        # ── other tabs still respond ──────────────────────────────────────────
        others = {}
        for s in ["home", "hooks", "calendar", "profile"]:
            await pg.evaluate(f"() => {{ if(typeof window.setTab==='function') window.setTab('{s}'); }}")
            await pg.wait_for_timeout(1400)
            others[s] = await pg.evaluate("""() => {
                const r = document.getElementById('root');
                return {len: r?r.innerHTML.length:0, text:(r?r.innerText:'').slice(0,70)};
            }""")
            await pg.screenshot(path=f"{OUT}/10-{s}.png")
        res["other_tabs"] = others

        # back to Create to confirm the seeding survived the round trip
        await pg.evaluate("() => { if(typeof window.setTab==='function') window.setTab('create'); }")
        await pg.wait_for_timeout(1200)
        res["create_after_roundtrip"] = await pg.evaluate("""() => {
            const st = (window.CPCreate && window.CPCreate.cs) ? window.CPCreate.cs() : null;
            return {step: st && st.step, platform: st && st.platform, has_cta_back: !!document.querySelector('.cc-h1')};
        }""")
        await pg.screenshot(path=f"{OUT}/11-create-after-roundtrip.png")

        res["uncaught_errors"] = errors
        await b.close()

    print(json.dumps(res, indent=2))


asyncio.run(main())
