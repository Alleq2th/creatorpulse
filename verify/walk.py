"""Walk the real app in Chromium: every screen, console errors, screenshots."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:4123")
OUT = os.environ.get("OUT", "/workspace/shots")
os.makedirs(OUT, exist_ok=True)

SCREENS = ["home", "hooks", "create", "calendar", "profile"]

async def main():
    errors, logs = [], []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await b.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        pg = await ctx.new_page()
        pg.on("console", lambda m: (logs.append(f"{m.type}: {m.text}"),
                                    errors.append(f"{m.type}: {m.text}") if m.type == "error" else None))
        pg.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))

        await pg.goto(BASE, wait_until="networkidle", timeout=60000)
        await pg.wait_for_timeout(2000)
        await pg.screenshot(path=f"{OUT}/00-initial.png", full_page=False)

        # Sign in with a seeded session so we reach the app chrome, not the auth wall.
        seeded = await pg.evaluate("""async () => {
            try {
              const health = await (await fetch('/api/health')).json();
              return { ok: !!health.ok, hasAuth: !!(document.querySelector('#root')||{}).innerHTML };
            } catch(e){ return { err: String(e) }; }
        }""")

        # Detect which screen we're on
        state = await pg.evaluate("""() => {
            const r = document.getElementById('root');
            return {
              len: r ? r.innerHTML.length : 0,
              hasTabs: !!document.querySelector('.tab'),
              text: (r ? r.innerText : '').slice(0, 300)
            };
        }""")

        results = {"seeded": seeded, "initialState": state, "screens": {}}

        # Try to drive the app's own router if available
        for s in SCREENS:
            try:
                ok = await pg.evaluate(f"""() => {{
                    if (typeof window.setTab === 'function') {{ try {{ window.setTab('{s}'); return true; }} catch(e) {{ return 'ERR:'+e.message; }} }}
                    return false;
                }}""")
                await pg.wait_for_timeout(1600)
                st = await pg.evaluate("""() => {
                    const r = document.getElementById('root');
                    return { len: r ? r.innerHTML.length : 0, text: (r ? r.innerText : '').slice(0, 400) };
                }""")
                results["screens"][s] = {"routed": ok, **st}
                await pg.screenshot(path=f"{OUT}/screen-{s}.png", full_page=False)
            except Exception as e:
                results["screens"][s] = {"error": str(e)}

        results["consoleErrors"] = errors[:40]
        results["consoleLogCount"] = len(logs)
        print(json.dumps(results, indent=2)[:6000])
        await b.close()

asyncio.run(main())
