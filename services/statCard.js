// Stat/carousel card renderer — this deliberately does NOT use AI image
// generation. Diffusion models cannot reliably render legible text (see the
// garbled scribbles in earlier thumbnail output) — that's a structural
// limitation of how those models work, not something better prompting fixes.
// Real text needs real typography: this builds an SVG template with actual
// text nodes, then rasterizes it to PNG with sharp. Every word on the card is
// exactly what was passed in — nothing hallucinated.
const sharp = require("sharp");

// Two real formats, not one-size-fits-all:
//   "instagram" — 1080x1350 (4:5) — Instagram feed/carousel posts
//   "tiktok"    — 1080x1920 (9:16) — TikTok, Reels, Stories
// Each has its own layout numbers (a 9:16 canvas is much taller/narrower,
// so text needs different sizing and vertical spacing, not just a resize).
const FORMATS = {
  instagram: { w: 1080, h: 1350, statSize: 220, statY: 480, statLabelY: 530, titleYWithStat: 620, titleYNoStat: 340, titleSize: 58, titleLine: 66, bodySize: 32, bodyLine: 44, titleChars: 20, bodyChars: 34 },
  tiktok:    { w: 1080, h: 1920, statSize: 240, statY: 620, statLabelY: 675, titleYWithStat: 800, titleYNoStat: 480, titleSize: 60, titleLine: 70, bodySize: 34, bodyLine: 48, titleChars: 18, bodyChars: 32 }
};
function resolveFormat(format) {
  const f = String(format || "instagram").toLowerCase();
  if (f.includes("tiktok") || f.includes("reel") || f.includes("story") || f.includes("9:16")) return FORMATS.tiktok;
  return FORMATS.instagram;
}

const PALETTE = {
  default:  { bg: "#161616", accent: "#A8452C", text: "#F6F6F6", sub: "#9a9a9a" },
  forest:   { bg: "#161616", accent: "#56754B", text: "#F6F6F6", sub: "#9a9a9a" },
  blue:     { bg: "#161616", accent: "#347AEA", text: "#F6F6F6", sub: "#9a9a9a" }
};

function escXml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function wrapText(text, maxCharsPerLine, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (trial.length > maxCharsPerLine && cur) { lines.push(cur); cur = w; }
    else cur = trial;
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxCharsPerLine - 1) lines[maxLines - 1] = last.slice(0, maxCharsPerLine - 1).trimEnd() + "…";
  }
  return lines;
}

function tspans(lines, x, startY, lineHeight) {
  return lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineHeight}">${escXml(l)}</tspan>`).join("");
}

// Rough width estimate for a bold serif number string — good enough to keep
// the stat number from ever running off the canvas, which the fixed-size
// version did for longer values like "£29.5m" at the larger TikTok size.
function fitStatFontSize(text, maxWidth, baseSize) {
  const estCharWidth = 0.85; // calibrated against actual render — bold serif digits/symbols render wider than typical text estimates
  const estWidth = String(text).length * baseSize * estCharWidth;
  if (estWidth <= maxWidth) return baseSize;
  return Math.floor(baseSize * (maxWidth / estWidth));
}

async function renderStatCard(slide, niche, palette, format) {
  const p = PALETTE[palette] || PALETTE.default;
  const f = resolveFormat(format);
  const titleLines = wrapText(slide.title, f.titleChars, 4);
  const bodyLines = wrapText(slide.body, f.bodyChars, 6);
  const hasStat = slide.stat != null && String(slide.stat).trim() !== "";
  const statFontSize = hasStat ? fitStatFontSize(slide.stat, f.w - 144, f.statSize) : f.statSize;

  const titleY = hasStat ? f.titleYWithStat : f.titleYNoStat;
  const bodyStartY = titleY + titleLines.length * f.titleLine + 60;

  const svg = `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${f.w}" height="${f.h}" fill="${p.bg}"/>
    <rect x="0" y="0" width="${f.w}" height="10" fill="${p.accent}"/>
    <text x="72" y="90" font-family="sans-serif" font-size="28" font-weight="700" fill="${p.accent}" letter-spacing="2">${escXml((niche||"").toUpperCase())}</text>
    <text x="${f.w-72}" y="90" font-family="sans-serif" font-size="28" font-weight="700" fill="${p.sub}" text-anchor="end">${slide.slideNum||1} / ${slide.totalSlides||5}</text>
    ${hasStat ? `
    <text x="72" y="${f.statY}" font-family="serif" font-size="${statFontSize}" font-weight="800" fill="${p.accent}">${escXml(slide.stat)}</text>
    ${slide.statLabel ? `<text x="72" y="${f.statLabelY}" font-family="sans-serif" font-size="30" fill="${p.sub}">${escXml(slide.statLabel)}</text>` : ""}
    ` : ""}
    <text x="72" y="${titleY}" font-family="serif" font-size="${f.titleSize}" font-weight="700" fill="${p.text}" style="line-height:1.15">${tspans(titleLines, 72, titleY, f.titleLine)}</text>
    <text x="72" y="${bodyStartY}" font-family="sans-serif" font-size="${f.bodySize}" fill="${p.sub}">${tspans(bodyLines, 72, bodyStartY, f.bodyLine)}</text>
    <rect x="72" y="${f.h-90}" width="${f.w-144}" height="4" fill="${p.accent}" opacity="0.4"/>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderCardSet(slides, niche, palette, format) {
  const total = slides.length;
  const buffers = await Promise.all(
    slides.map((s, i) => renderStatCard({ ...s, slideNum: i + 1, totalSlides: total }, niche, palette, format))
  );
  return buffers.map(b => `data:image/png;base64,${b.toString("base64")}`);
}

module.exports = { renderStatCard, renderCardSet };
