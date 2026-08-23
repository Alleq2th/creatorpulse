// Stat/carousel card renderer — this deliberately does NOT use AI image
// generation. Diffusion models cannot reliably render legible text (see the
// garbled scribbles in earlier thumbnail output) — that's a structural
// limitation of how those models work, not something better prompting fixes.
// Real text needs real typography: this builds an SVG template with actual
// text nodes, then rasterizes it to PNG with sharp. Every word on the card is
// exactly what was passed in — nothing hallucinated.
//
// Fonts: "Space Grotesk" (headlines/stat numbers) and "Inter" (body/labels)
// are bundled in assets/fonts and registered with fontconfig by
// scripts/setupFonts.js at build/boot time — see that file for why. If those
// fonts aren't installed for any reason, these font-family names just fall
// back to the platform default sans, so this never hard-fails.
const sharp = require("sharp");

const FONT_DISPLAY = "Space Grotesk, sans-serif"; // headline + stat numbers
const FONT_BODY = "Inter, sans-serif";            // body copy + labels

// Two real formats, not one-size-fits-all:
//   "instagram" — 1080x1350 (4:5) — Instagram feed/carousel posts
//   "tiktok"    — 1080x1920 (9:16) — TikTok, Reels, Stories
const FORMATS = {
  instagram: { w: 1080, h: 1350, statSize: 220, statY: 480, statLabelY: 530, titleYWithStat: 620, titleYNoStat: 340, titleSize: 58, titleLine: 66, bodySize: 32, bodyLine: 44, titleChars: 20, bodyChars: 34, hookTitleSize: 92, hookTitleLine: 100, hookTitleChars: 12 },
  tiktok:    { w: 1080, h: 1920, statSize: 240, statY: 620, statLabelY: 675, titleYWithStat: 800, titleYNoStat: 480, titleSize: 60, titleLine: 70, bodySize: 34, bodyLine: 48, titleChars: 18, bodyChars: 32, hookTitleSize: 100, hookTitleLine: 108, hookTitleChars: 11 }
};
function resolveFormat(format) {
  const f = String(format || "instagram").toLowerCase();
  if (f.includes("tiktok") || f.includes("reel") || f.includes("story") || f.includes("9:16")) return FORMATS.tiktok;
  return FORMATS.instagram;
}

// Full-card gradient palettes. Each is a 2-stop diagonal gradient plus an
// accent color (for the stat number / pill / swipe cue) and a text color
// chosen for contrast against that gradient. This is what the user picks
// from a color/gradient selector in the app.
const PALETTE = {
  noir:    { stops: ["#1a1a1a", "#2c2420"], accent: "#d4763f", text: "#f6f6f6", sub: "#b8b0aa" },
  ember:   { stops: ["#2b0f0a", "#5c1f14"], accent: "#ff7a45", text: "#fbeae2", sub: "#e0b8ab" },
  sunset:  { stops: ["#3a1a4a", "#8a3b3b"], accent: "#ffb454", text: "#fdf3e7", sub: "#e6c9b8" },
  ocean:   { stops: ["#0a1f2e", "#123a4f"], accent: "#4fc3d9", text: "#eef8fb", sub: "#a8ccd6" },
  forest:  { stops: ["#12241a", "#1e4030"], accent: "#7fd18f", text: "#eef6f0", sub: "#a9c9b3" },
  royal:   { stops: ["#150f3a", "#2c1f5e"], accent: "#9d8cff", text: "#f0edff", sub: "#c3b9e8" }
};
const DEFAULT_PALETTE = "noir";

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

// Rough width estimate — keeps the stat number from running off the canvas
// on longer values like "£29.5m" at the larger TikTok size.
function fitStatFontSize(text, maxWidth, baseSize) {
  const estCharWidth = 0.72; // Space Grotesk digits are narrower than the old serif estimate
  const estWidth = String(text).length * baseSize * estCharWidth;
  if (estWidth <= maxWidth) return baseSize;
  return Math.floor(baseSize * (maxWidth / estWidth));
}

function gradientDefs(p, w, h) {
  return `<linearGradient id="bgGrad" x1="0" y1="0" x2="${w}" y2="${h}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${p.stops[0]}"/>
    <stop offset="100%" stop-color="${p.stops[1]}"/>
  </linearGradient>`;
}

// Swipe cue — a simple double-chevron + label, used on hook slides to nudge
// the viewer to keep going. Static (this is a rasterized PNG), so it reads
// as an icon rather than an animation.
function swipeCue(x, y, accent) {
  return `<g transform="translate(${x},${y})" opacity="0.9">
    <text x="0" y="0" font-family="${FONT_BODY}" font-size="24" font-weight="600" letter-spacing="3" fill="${accent}" text-anchor="end">SWIPE</text>
    <path d="M 16 -8 L 26 0 L 16 8" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 30 -8 L 40 0 L 30 8" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
  </g>`;
}

function slideChrome(p, f, niche, slideNum, totalSlides) {
  return `
    <text x="72" y="90" font-family="${FONT_BODY}" font-size="26" font-weight="700" fill="${p.accent}" letter-spacing="2">${escXml((niche||"").toUpperCase())}</text>
    <text x="${f.w-72}" y="90" font-family="${FONT_BODY}" font-size="26" font-weight="700" fill="${p.sub}" text-anchor="end">${slideNum||1} / ${totalSlides||5}</text>`;
}

// ── Hook slide: the opening beat of the story. Big, bold, asymmetric —
// title sits left-anchored roughly a third down the card, not dead center,
// with the swipe cue anchored bottom-right.
function renderHookSVG(p, f, slide, niche, slideNum, totalSlides) {
  const lines = wrapText(slide.title || slide.body, f.hookTitleChars, 5);
  const startY = Math.round(f.h * 0.38);
  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    <defs>${gradientDefs(p, f.w, f.h)}</defs>
    <rect width="${f.w}" height="${f.h}" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="${f.w}" height="10" fill="${p.accent}"/>
    ${slideChrome(p, f, niche, slideNum, totalSlides)}
    <text x="72" y="${startY}" font-family="${FONT_DISPLAY}" font-size="${f.hookTitleSize}" font-weight="700" fill="${p.text}">${tspans(lines, 72, startY, f.hookTitleLine)}</text>
    ${swipeCue(f.w - 72, f.h - 70, p.accent)}
    <rect x="72" y="${f.h-40}" width="${f.w-144}" height="4" fill="${p.accent}" opacity="0.4"/>
  </svg>`;
}

// ── Body slide: the existing stat-card layout, restyled onto a full
// gradient background with the new font system.
function renderBodySVG(p, f, slide, niche, slideNum, totalSlides) {
  const titleLines = wrapText(slide.title, f.titleChars, 4);
  const bodyLines = wrapText(slide.body, f.bodyChars, 6);
  const hasStat = slide.stat != null && String(slide.stat).trim() !== "";
  const statFontSize = hasStat ? fitStatFontSize(slide.stat, f.w - 144, f.statSize) : f.statSize;
  const titleY = hasStat ? f.titleYWithStat : f.titleYNoStat;
  const bodyStartY = titleY + titleLines.length * f.titleLine + 60;

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    <defs>${gradientDefs(p, f.w, f.h)}</defs>
    <rect width="${f.w}" height="${f.h}" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="${f.w}" height="10" fill="${p.accent}"/>
    ${slideChrome(p, f, niche, slideNum, totalSlides)}
    ${hasStat ? `
    <text x="72" y="${f.statY}" font-family="${FONT_DISPLAY}" font-size="${statFontSize}" font-weight="700" fill="${p.accent}">${escXml(slide.stat)}</text>
    ${slide.statLabel ? `<text x="72" y="${f.statLabelY}" font-family="${FONT_BODY}" font-size="28" fill="${p.sub}">${escXml(slide.statLabel)}</text>` : ""}
    ` : ""}
    <text x="72" y="${titleY}" font-family="${FONT_DISPLAY}" font-size="${f.titleSize}" font-weight="700" fill="${p.text}">${tspans(titleLines, 72, titleY, f.titleLine)}</text>
    <text x="72" y="${bodyStartY}" font-family="${FONT_BODY}" font-size="${f.bodySize}" fill="${p.sub}">${tspans(bodyLines, 72, bodyStartY, f.bodyLine)}</text>
    <rect x="72" y="${f.h-90}" width="${f.w-144}" height="4" fill="${p.accent}" opacity="0.4"/>
  </svg>`;
}

// ── Outro slide: the closing beat — a CTA, centered vertically, with an
// optional handle/tag line underneath. No stat, no clutter.
function renderOutroSVG(p, f, slide, niche, slideNum, totalSlides) {
  const ctaLines = wrapText(slide.title || slide.body, f.hookTitleChars, 4);
  const subLines = slide.body && slide.title ? wrapText(slide.body, f.bodyChars, 3) : [];
  const ctaBlockH = ctaLines.length * f.hookTitleLine;
  const ctaY = Math.round(f.h / 2 - ctaBlockH / 2);
  const subY = ctaY + ctaBlockH + 56;

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    <defs>${gradientDefs(p, f.w, f.h)}</defs>
    <rect width="${f.w}" height="${f.h}" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="${f.w}" height="10" fill="${p.accent}"/>
    ${slideChrome(p, f, niche, slideNum, totalSlides)}
    <text x="72" y="${ctaY}" font-family="${FONT_DISPLAY}" font-size="${f.hookTitleSize}" font-weight="700" fill="${p.text}">${tspans(ctaLines, 72, ctaY, f.hookTitleLine)}</text>
    ${subLines.length ? `<text x="72" y="${subY}" font-family="${FONT_BODY}" font-size="${f.bodySize}" fill="${p.sub}">${tspans(subLines, 72, subY, f.bodyLine)}</text>` : ""}
    <rect x="72" y="${f.h-40}" width="${f.w-144}" height="4" fill="${p.accent}" opacity="0.4"/>
  </svg>`;
}

function resolveRole(slide, index, total) {
  if (slide.role === "hook" || slide.role === "body" || slide.role === "outro") return slide.role;
  if (index === 0) return "hook";
  if (index === total - 1 && total > 1) return "outro";
  return "body";
}

async function renderStatCard(slide, niche, palette, format) {
  const p = PALETTE[palette] || PALETTE[DEFAULT_PALETTE];
  const f = resolveFormat(format);
  const role = resolveRole(slide, (slide.slideNum || 1) - 1, slide.totalSlides || 1);
  const svg = role === "hook" ? renderHookSVG(p, f, slide, niche, slide.slideNum, slide.totalSlides)
    : role === "outro" ? renderOutroSVG(p, f, slide, niche, slide.slideNum, slide.totalSlides)
    : renderBodySVG(p, f, slide, niche, slide.slideNum, slide.totalSlides);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderCardSet(slides, niche, palette, format) {
  const total = slides.length;
  const buffers = await Promise.all(
    slides.map((s, i) => renderStatCard({ ...s, slideNum: i + 1, totalSlides: total }, niche, palette, format))
  );
  return buffers.map(b => `data:image/png;base64,${b.toString("base64")}`);
}

module.exports = { renderStatCard, renderCardSet, PALETTE, DEFAULT_PALETTE };
