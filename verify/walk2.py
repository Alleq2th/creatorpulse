"""Walk the real app in Chromium with a seeded session: every screen, console errors, screenshots."""
import asyncio, json, os
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:4123")
OUT = os.environ.get("OUT", "/workspace/shots")
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

SCREENS = ["home", "hooks", "create", "calendar", "profile"]

async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await b.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True, has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        await ctx.add_init_script(
            "try{localStorage.setItem('cp_v2', JSON.stringify(%s));}catch(e){}" % json.dumps(SEED)
        )
        pg = await ctx.new_page()
        pg.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))

        await pg.goto(BASE, wait_until="networkidle", timeout=60000)
        await pg.wait_for_timeout(3000)

        st = await pg.evaluate("""() => {
            const r = document.getElementById('root');
            return { len: r?r.innerHTML.length:0, hasTabs: !!document.querySelector('.tab'),
                     text: (r?r.innerText:'').slice(0,200) };
        }""")
        res = {"afterSeed": st, "screens": {}}
        await pg.screenshot(path=f"{OUT}/00-home.png")

        for s in SCREENS:
            try:
                await pg.evaluate(f"() => {{ if(typeof window.setTab==='function') window.setTab('{s}'); }}")
                await pg.wait_for_timeout(2500)
                info = await pg.evaluate("""() => {
                    const r = document.getElementById('root');
                    // main thread responsive probe
                    const t0 = performance.now(); let spin = 0;
                    while (performance.now() - t0 < 1) spin++;
                    return { len: r?r.innerHTML.length:0, text:(r?r.innerText:'').slice(0,300),
                             responsive: true, tab: (window.S&&S.tab)||null };
                }""")
                # tap a button after switching to prove the page is alive
                alive = await pg.evaluate("""() => {
                    const btn = document.querySelector('.tab');
                    if(!btn) return 'no-tab';
                    const before = document.getElementById('root').innerHTML.length;
                    btn.click();
                    return {before, clicked:true};
                }""")
                await pg.wait_for_timeout(900)
                after = await pg.evaluate("() => (document.getElementById('root')||{}).innerHTML.length")
                res["screens"][s] = {**info, "aliveAfterTap": after != alive.get("before") if isinstance(alive, dict) else None,
                                     "lenAfter": after}
                await pg.screenshot(path=f"{OUT}/screen-{s}.png")
            except Exception as e:
                res["screens"][s] = {"error": str(e)}

        res["consoleErrors"] = errors[:50]
        res["errorCount"] = len(errors)
        print(json.dumps(res, indent=2)[:8000])
        await b.close()

asyncio.run(main())
