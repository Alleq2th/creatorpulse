// Renders the two White Panel templates at 4:5 and 9:16 with real news photos
// and both a long and a short headline, so the design can be judged on the
// actual generated output (not a mockup) and compared against the references.
//
// Run: node scripts/render-whitepanel.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.CP_BASE || 'http://localhost:4173';
const OUT = path.join(__dirname, '..', 'shots', 'whitepanel');

const PHOTOS = {
  football: 'news1.jpg',
  basketball: 'news2.jpg'
};

const CASES = [
  {
    id: 'white_panel', platform: 'instagram', format: 'instagram', aspect: '4:5',
    photo: 'football', category: 'FOOTBALL',
    headline: 'Jets shut down McDonald trade request after reduced snap count',
    supportingText: 'The front office says it has no intention of moving the edge rusher.'
  },
  {
    id: 'white_panel', platform: 'instagram', format: 'instagram', aspect: '4:5',
    photo: 'basketball', category: 'BASKETBALL',
    headline: 'Lakers win',
    supportingText: 'A fourth-quarter run sealed it.'
  },
  {
    id: 'white_panel', platform: 'tiktok', format: 'tiktok', aspect: '9:16',
    photo: 'football', category: 'FOOTBALL',
    headline: 'Jets shut down McDonald trade request after reduced snap count',
    supportingText: 'The front office says it has no intention of moving the edge rusher.'
  },
  {
    id: 'white_panel', platform: 'tiktok', format: 'tiktok', aspect: '9:16',
    photo: 'basketball', category: 'BASKETBALL',
    headline: 'Lakers win',
    supportingText: 'A fourth-quarter run sealed it.'
  },
  {
    id: 'white_panel_inset', platform: 'instagram', format: 'instagram', aspect: '4:5',
    photo: 'basketball', category: 'BASKETBALL',
    headline: 'Jets shut down McDonald trade request after reduced snap count',
    supportingText: 'The front office says it has no intention of moving the edge rusher.'
  },
  {
    id: 'white_panel_inset', platform: 'instagram', format: 'instagram', aspect: '4:5',
    photo: 'football', category: 'FOOTBALL',
    headline: 'Lakers win',
    supportingText: 'A fourth-quarter run sealed it.'
  },
  {
    id: 'white_panel_inset', platform: 'tiktok', format: 'tiktok', aspect: '9:16',
    photo: 'basketball', category: 'BASKETBALL',
    headline: 'Jets shut down McDonald trade request after reduced snap count',
    supportingText: 'The front office says it has no intention of moving the edge rusher.'
  },
  {
    id: 'white_panel_inset', platform: 'tiktok', format: 'tiktok', aspect: '9:16',
    photo: 'football', category: 'FOOTBALL',
    headline: 'Lakers win',
    supportingText: 'A fourth-quarter run sealed it.'
  }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
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

  // Inline the photos as data URLs so the SVG <image> resolves offline.
  const photos = {};
  for (const [k, f] of Object.entries(PHOTOS)) {
    const b = fs.readFileSync(path.join(OUT, f));
    photos[k] = 'data:image/jpeg;base64,' + b.toString('base64');
  }

  const jobs = await page.evaluate(({ cases, photos }) => {
    return cases.map((c) => {
      const slide = {
        type: 'hook',
        headline: c.headline,
        supportingText: c.supportingText,
        category: c.category,
        ctaLine: 'FOLLOW FOR MORE',
        slideNumber: 1
      };
      const img = window.localCardImage(slide, {
        templateId: c.id,
        format: c.format,
        total: 1,
        imageDataUrl: photos[c.photo],
        palette: 'noir_orange',
        theme: 'modern_dark',
        typography: 'impact',
        density: 'balanced'
      });
      return Object.assign({}, c, { img });
    });
  }, { cases: CASES, photos });

  // One full-size PNG per case.
  for (const j of jobs) {
    const p2 = await ctx.newPage();
    const w = 540;
    const h = j.aspect === '9:16' ? 960 : 675;
    await p2.setViewportSize({ width: w, height: h });
    await p2.setContent(`<body style="margin:0;background:#000"><img src="${j.img}" style="width:100%;display:block"></body>`);
    await p2.waitForTimeout(400);
    const name = `${j.id}-${j.aspect.replace(':', 'x')}-${j.headline.length > 20 ? 'long' : 'short'}.png`;
    await p2.screenshot({ path: path.join(OUT, name) });
    await p2.close();
    j.file = name;
  }

  // A contact sheet, grouped by template.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0b0b0e;font:600 12px/1.4 Inter,system-ui,sans-serif;color:#cfcfd6;padding:18px}
    h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8b8b96;margin:24px 0 12px}
    .row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
    .cell{width:230px}
    .cell img{width:230px;display:block;border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,.5)}
    .cap{margin-top:7px;font-size:10.5px;color:#9a9aa4}
  </style></head><body>
  ${['white_panel', 'white_panel_inset'].map(id => `<h2>${id}</h2><div class="row">` +
    jobs.filter(j => j.id === id).map(j =>
      `<div class="cell"><img src="${j.img}"><div class="cap">${j.aspect} · ${j.category} · ${j.headline.length > 20 ? 'long headline' : 'short headline'}</div></div>`
    ).join('') + '</div>').join('')}
  </body></html>`;

  const tmp = path.join(OUT, '_sheet.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'whitepanel-sheet.png'), fullPage: true });

  console.log('rendered', jobs.length, 'cards');
  console.log(jobs.map(j => j.file).join('\n'));
  console.log('errors:', errs.slice(0, 5));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
