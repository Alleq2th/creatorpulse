// Renders the REAL generated cards (localCardImage) for every template and
// writes them as PNGs, so the design can be judged on the actual output rather
// than on a mockup. This is the visual gate for the template overhaul.
//
// Run: node scripts/render-cards.js <label>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.CP_BASE || 'http://localhost:4173';
const LABEL = process.argv[2] || 'cards';
const OUT = path.join(__dirname, '..', 'shots', LABEL);

const SLIDES = [
  { type: 'hook', headline: 'Jets shut down McDonald trade request', supportingText: 'The front office is not moving him.', ctaLine: 'FOLLOW FOR MORE', slideNumber: 1 },
  { type: 'body', headline: 'The request', sectionLabel: 'WHAT HAPPENED', body: 'Will McDonald IV asked to be traded after a reduced snap count.', slideNumber: 2 },
  { type: 'body', headline: 'The response', sectionLabel: 'THE ANSWER', body: 'New York said it has no intention of moving the edge rusher.', slideNumber: 3 },
  { type: 'body', headline: 'Why it matters', sectionLabel: 'THE CONTEXT', body: 'He remains a core part of the rotation for the second half.', ctaLine: 'FOLLOW FOR MORE', slideNumber: 4 }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));

  await page.addInitScript(() => {
    localStorage.setItem('cp_v2', JSON.stringify({
      token: 't', refreshToken: null,
      user: { id: 'u', email: 'a@b.c', name: 'Big_Greg', handle: 'big_greg', niches: ['American Football'], platforms: ['instagram', 'tiktok'], primaryPlatform: 'instagram', postsPerDay: 3 },
      connections: {}
    }));
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 120; i++) {
    if (await page.evaluate(() => typeof window.CPCardLayout !== 'undefined' && typeof window.localCardImage === 'function')) break;
    await page.waitForTimeout(200);
  }

  const jobs = await page.evaluate((slides) => {
    const out = [];
    const T = window.CPCardTemplates;
    ['instagram', 'tiktok'].forEach((platform) => {
      T.list(platform).forEach((t) => {
        slides.forEach((s, i) => {
          const img = window.localCardImage(
            Object.assign({}, s, { slideNumber: i + 1 }),
            { templateId: t.id, format: platform === 'tiktok' ? 'tiktok' : 'instagram', total: slides.length, palette: 'noir_orange', theme: 'modern_dark', typography: 'impact', density: 'balanced' }
          );
          out.push({ id: t.id, name: t.name, platform, idx: i + 1, img });
        });
      });
    });
    return out;
  }, SLIDES);

  // Lay every card out on one page, at a readable size, and screenshot it.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0b0b0e;font:600 12px/1.4 Inter,system-ui,sans-serif;color:#cfcfd6;padding:16px}
    h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8b8b96;margin:22px 0 10px}
    .row{display:flex;gap:12px;flex-wrap:wrap}
    .cell{width:200px}
    .cell img{width:200px;display:block;border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,.5)}
    .cap{margin-top:6px;font-size:10.5px;color:#9a9aa4}
  </style></head><body>
  ${['instagram', 'tiktok'].map(p => `<h2>${p}</h2>` + jobs.filter(j => j.platform === p).map(j =>
    `<div class="cell"><img src="${j.img}"><div class="cap">${j.name} · slide ${j.idx}</div></div>`
  ).join('')).join('')}
  </body></html>`;

  const tmp = path.join(OUT, '_sheet.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'all-cards.png'), fullPage: true });

  // Also one full-size card per template (slide 1), for close inspection.
  for (const j of jobs.filter(x => x.idx === 1)) {
    const p2 = await ctx.newPage();
    await p2.setViewportSize({ width: 540, height: j.platform === 'tiktok' ? 960 : 675 });
    await p2.setContent(`<body style="margin:0;background:#000"><img src="${j.img}" style="width:100%;display:block"></body>`);
    await p2.waitForTimeout(300);
    await p2.screenshot({ path: path.join(OUT, `card-${j.platform}-${j.id}.png`) });
    await p2.close();
  }

  console.log('rendered', jobs.length, 'cards');
  console.log('errors:', errs.slice(0, 5));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
