/* Boot the real app through its real code path, with the API stubbed.
 *
 * Why stub: this sandbox has no Supabase database and no Groq key, so the real
 * endpoints answer 401/503. Stubbing them lets the app's OWN login → state →
 * render path run unchanged, which is what we actually want to test. The app
 * code under test is untouched; only the network is faked.
 *
 * Returns helper handles used by the verification scripts.
 */
const USER = {
  id: 'u1', name: 'Test Creator', handle: 'testcreator', email: 'test@example.com',
  niches: ['Sport', 'Business'], platforms: ['tiktok', 'youtube', 'twitter'],
  primaryPlatform: 'tiktok', postsPerDay: 3, tier: 'free'
};

const TRENDS = [
  { id: 't1', headline: 'Lakers stun Celtics in overtime thriller', summary: 'LeBron James scored 41 points as the Lakers beat the Celtics 128-124 in overtime.', niche: 'Sport', image: null, score: 88, timestamp: Date.now() - 3600000 },
  { id: 't2', headline: 'Fed holds rates steady amid cooling inflation', summary: 'The Federal Reserve kept interest rates unchanged, signalling two cuts later this year.', niche: 'Business', image: null, score: 74, timestamp: Date.now() - 7200000 },
  { id: 't3', headline: 'New AI model tops coding benchmarks', summary: 'A new model beat previous records on standard coding tests.', niche: 'Business', image: null, score: 66, timestamp: Date.now() - 10800000 }
];

async function stub(page) {
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    const json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    // The app builds its story list from these three feeds (core.js:560-562),
    // not from an /api/trends endpoint — so these are what must answer.
    if (/\/(api\/news|api\/blog-feed|api\/twitter-feed)/.test(url)) {
      const niche = decodeURIComponent((url.match(/niche=([^&]*)/) || [])[1] || 'Sport');
      const pool = niche === 'Business' ? [TRENDS[1], TRENDS[2]] : [TRENDS[0]];
      return json({ articles: pool });
    }
    if (/\/api\/auth\/login/.test(url)) return json({ token: 'test-token', refreshToken: 'r1', user: USER });
    if (/\/api\/me(\?|$)/.test(url)) return json({ user: USER });
    if (/\/api\/trends/.test(url)) return json({ trends: TRENDS });
    if (/\/api\/events/.test(url)) return json({ events: [{ title: 'Champions League Final', date: '2026-06-06', niche: 'Sport', desc: 'The biggest club match of the year.' }] });
    if (/\/api\/schedule/.test(url)) return json({ posts: [], schedule: [] });
    if (/\/api\/saved-posts/.test(url)) return json({ posts: [{ id: 'd1', headline: 'My saved draft', content_type: 'Script', content: { content: 'A short draft about consistency.' }, niche: 'Sport' }] });
    if (/\/api\/health/.test(url)) return json({ ok: true });
    if (/\/api\/generate$/.test(url)) return json({ text: 'Nobody is talking about the real story here. The numbers changed, and the reaction tells you everything.' });
    if (/\/api\/generate-image/.test(url)) return json({ success: false, error: 'stubbed' });
    if (/\/api\/stat-card/.test(url)) return json({ success: false, error: 'stubbed' });
    if (/\/api\/pulse-ai/.test(url)) return json({ reply: 'stub', memory: {}, conversations: [] });
    if (/\/api\/save-post/.test(url)) return json({ success: true, id: 'p1' });
    return json({ ok: true });
  });
}

/* Log in through the real form so the app itself decides it is signed in. */
async function login(page, base) {
  // Unregister any service worker before the first navigation. A leftover
  // worker (registerServiceWorker() in core.js) will replay cached scripts
  // from a previous run and make the code under test look stale — a false
  // failure that has nothing to do with the change being verified.
  await page.addInitScript(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
    }
  });

  // The server has a 300-requests-per-15-minutes global limiter keyed on IP.
  // A full walk-through loads ~40 files, so a handful of runs exhausts it and
  // the HTML itself starts answering 429 — which looks like a code bug but is
  // not. The server runs with `trust proxy`, so each run gets its own bucket.
  const ip = '10.' + Math.floor(Math.random() * 250) + '.' +
             Math.floor(Math.random() * 250) + '.' + (1 + Math.floor(Math.random() * 250));
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 20000 });
  await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'password123');
  await page.click('button[type="submit"], .btn-primary, button:has-text("Sign in")');
  await page.waitForFunction(() => {
    const r = document.getElementById('root');
    return r && r.innerHTML.length > 400 && !/auth-wrap/.test(r.innerHTML);
  }, null, { timeout: 25000, polling: 200 });
  await page.waitForTimeout(1800); // let the first feeds settle

  // The cookie banner sits above the tab bar and swallows taps until dismissed.
  // It is a real part of the app, so accept it the way a person would.
  await page.evaluate(() => {
    localStorage.setItem('cp_cookie_ok', '1');
    localStorage.setItem('cp_cookies', 'accepted');
    const b = document.getElementById('cp-cookie-banner');
    if (b) b.remove();
  });
}

/* Stub the network, then log in through the real form.
 * Both live here so the order can't be got wrong: routes must be registered
 * BEFORE the first navigation, otherwise the very first API calls go to the
 * real server, answer 401 (no database in this sandbox), and the app boots into
 * a broken state that looks like a bug in the code under test. */
async function boot(page, base) {
  await stub(page);
  await login(page, base);
}

module.exports = { stub, login, boot, USER, TRENDS };
