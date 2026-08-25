// ─────────────────────────────────────────────────────────────────────────
// Carousel card rendering system.
//
// This deliberately does NOT call an image-generation model per slide.
// Diffusion models can't reliably render legible text — that's a structural
// limitation, not a prompting problem. Instead: the AI generates structured
// JSON (see AI_SCHEMA_EXAMPLE below), and this file is a deterministic
// template renderer — real SVG text nodes composited with sharp — so output
// is visually consistent at any volume (1 card or 10,000).
//
// NOTE ON LOGOS: the spec calls for real league/brand logos (F1, NBA, etc).
// This file does NOT embed those — shipping trademarked league marks inside
// a product that mass-generates commercial social content is a real
// liability regardless of how the logo is sourced. Instead there's a
// pluggable CATEGORY_ICON system using original geometric glyphs. If you
// have actual rights to specific league marks, drop the asset URLs into
// CATEGORY_ICON_OVERRIDES and they'll be used as-is.
// ─────────────────────────────────────────────────────────────────────────
const sharp = require("sharp");
const fetch = require("node-fetch");

const FONT_SERIF = "'DM Serif Display', Georgia, serif"; // hook + outro headlines (italic)
const FONT_SANS = "Inter, sans-serif";                    // everything else — weight via font-weight

// ── Formats ────────────────────────────────────────────────────────────
const FORMATS = {
  instagram: {
    w: 1080, h: 1350,
    margin: 76,
    headerY: 90, dashY: 122, dashW: owidth => 0, // computed inline
    hookHeadlineY: 0.37, hookHeadlineSize: 84, hookHeadlineLine: 92, hookHeadlineChars: 13, hookMaxLines: 4,
    hookSupportGap: 56, hookSupportSize: 32, hookSupportLine: 44, hookSupportChars: 46,
    statY: 470, statSize: 210, statLabelGap: 46, statLabelSize: 26,
    bodyHeadlineSize: 52, bodyHeadlineLine: 60, bodyHeadlineChars: 22, bodyHeadlineMaxLines: 3,
    sectionLabelSize: 24, bodyTextSize: 30, bodyTextLine: 42, bodyTextChars: 40, bodyTextMaxLines: 3,
    outroHeadlineSize: 76, outroHeadlineLine: 84, outroHeadlineChars: 14, outroMaxLines: 4,
  },
  tiktok: {
    w: 1080, h: 1920,
    margin: 76,
    headerY: 96, dashY: 130,
    hookHeadlineY: 0.36, hookHeadlineSize: 92, hookHeadlineLine: 100, hookHeadlineChars: 12, hookMaxLines: 4,
    hookSupportGap: 60, hookSupportSize: 34, hookSupportLine: 46, hookSupportChars: 42,
    statY: 620, statSize: 240, statLabelGap: 50, statLabelSize: 28,
    bodyHeadlineSize: 58, bodyHeadlineLine: 66, bodyHeadlineChars: 20, bodyHeadlineMaxLines: 3,
    sectionLabelSize: 26, bodyTextSize: 32, bodyTextLine: 46, bodyTextChars: 36, bodyTextMaxLines: 3,
    outroHeadlineSize: 84, outroHeadlineLine: 92, outroHeadlineChars: 13, outroMaxLines: 4,
  }
};
function resolveFormat(format) {
  const f = String(format || "instagram").toLowerCase();
  if (f.includes("tiktok") || f.includes("reel") || f.includes("story") || f.includes("9:16")) return FORMATS.tiktok;
  return FORMATS.instagram;
}

// ── Palettes ───────────────────────────────────────────────────────────
// Exactly the six requested. Dark, editorial, one accent each.
const PALETTE = {
  noir_orange:   { name: "Noir Orange",   backgroundStart: "#08090C", backgroundEnd: "#21140E", accent: "#FF7A1A", primaryText: "#F5F3EF", secondaryText: "#B8B6B2", muted: "#737373" },
  electric_blue: { name: "Electric Blue", backgroundStart: "#07090D", backgroundEnd: "#0E1E33", accent: "#3DA9FC", primaryText: "#F3F6FA", secondaryText: "#AEB9C4", muted: "#6E7A85" },
  emerald:       { name: "Emerald",       backgroundStart: "#07100C", backgroundEnd: "#0E2A1E", accent: "#2ECC8F", primaryText: "#F1F7F3", secondaryText: "#AEC2B7", muted: "#6D7E75" },
  violet:        { name: "Violet",        backgroundStart: "#0A0812", backgroundEnd: "#221130", accent: "#A855F7", primaryText: "#F5F2FA", secondaryText: "#BFB3CC", muted: "#79708A" },
  crimson:       { name: "Crimson",       backgroundStart: "#0D0708", backgroundEnd: "#2B0F14", accent: "#E5484D", primaryText: "#F7EFEF", secondaryText: "#CBAFAF", muted: "#8A6E6E" },
  gold:          { name: "Gold",          backgroundStart: "#0B0A06", backgroundEnd: "#241C0B", accent: "#E8B93D", primaryText: "#F7F4EB", secondaryText: "#C7BEA3", muted: "#84795A" }
};
const DEFAULT_PALETTE = "noir_orange";
// Old palette names from the previous version, mapped forward so existing
// saved content / in-flight requests don't break.
const PALETTE_ALIASES = { noir: "noir_orange", ember: "crimson", sunset: "gold", ocean: "electric_blue", forest: "emerald", royal: "violet" };
function resolvePalette(key) {
  const k = PALETTE_ALIASES[key] || key;
  return PALETTE[k] || PALETTE[DEFAULT_PALETTE];
}

// ── Category icons (original glyphs — see note at top of file) ──────────
// Each is a small self-contained SVG path group, drawn in the accent color,
// sized to sit inside a ~40x40 box. Falls back to a two-letter monogram for
// any category not listed here.
const CATEGORY_ICON_OVERRIDES = {}; // { slug: '<svg .../>' } — drop licensed assets here if you have rights to them
const CATEGORY_ICON = {
  football:   `<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M20 10 L26 15 L24 22 L16 22 L14 15 Z" fill="currentColor"/>`,
  basketball: `<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M5 20 H35 M20 5 V35 M9 9 Q20 20 9 31 M31 9 Q20 20 31 31" stroke="currentColor" stroke-width="2" fill="none"/>`,
  formula_1:  `<path d="M6 26 L16 26 L20 14 L26 14 L22 26 L34 26" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="square"/>`,
  fitness:    `<rect x="4" y="16" width="6" height="8" rx="1.5" fill="currentColor"/><rect x="30" y="16" width="6" height="8" rx="1.5" fill="currentColor"/><rect x="10" y="18" width="20" height="4" fill="currentColor"/>`,
  beauty:     `<path d="M20 6 C24 12 30 14 30 21 C30 27 25.5 32 20 32 C14.5 32 10 27 10 21 C10 14 16 12 20 6 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  tech:       `<rect x="8" y="8" width="24" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="16" y="16" width="8" height="8" fill="currentColor"/><path d="M20 4 V8 M20 32 V36 M4 20 H8 M32 20 H36" stroke="currentColor" stroke-width="2"/>`,
  finance:    `<path d="M6 30 L15 18 L22 24 L34 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 10 H34 V18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  gaming:     `<rect x="4" y="14" width="32" height="16" rx="8" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 18 V26 M8 22 H16" stroke="currentColor" stroke-width="2.5"/><circle cx="27" cy="19" r="2" fill="currentColor"/><circle cx="31" cy="23" r="2" fill="currentColor"/>`,
  business:   `<rect x="6" y="14" width="28" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14 14 V10 Q14 8 16 8 H24 Q26 8 26 10 V14" stroke="currentColor" stroke-width="2.5" fill="none"/>`,
  entertainment: `<path d="M6 12 L34 12 L30 20 L34 28 L6 28 L10 20 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`,
  default:    `<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="4" fill="currentColor"/>`
};
function categoryIconSVG(slug) {
  if (CATEGORY_ICON_OVERRIDES[slug]) return CATEGORY_ICON_OVERRIDES[slug];
  return CATEGORY_ICON[slug] || CATEGORY_ICON.default;
}

// ── Text helpers ──────────────────────────────────────────────────────
function escXml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function wrapWords(text, maxCharsPerLine) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (trial.length > maxCharsPerLine && cur) { lines.push(cur); cur = w; }
    else cur = trial;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Layout protection: try wrapping at the base size; if it needs more lines
// than allowed, step the font size down (which effectively allows more
// characters per line) up to 2 steps before truncating the last line with
// an ellipsis. Never allows text to overflow past maxLines.
function fitMultilineText(text, baseSize, baseChars, maxLines) {
  const steps = [1, 0.88, 0.78];
  for (const step of steps) {
    const size = Math.round(baseSize * step);
    const chars = Math.round(baseChars / step);
    const lines = wrapWords(text, chars);
    if (lines.length <= maxLines) return { lines, size };
    if (step === steps[steps.length - 1]) {
      const clipped = lines.slice(0, maxLines);
      const last = clipped[maxLines - 1];
      clipped[maxLines - 1] = last.length > chars - 1 ? last.slice(0, chars - 1).trimEnd() + "…" : last + "…";
      return { lines: clipped, size };
    }
  }
}

function tspans(lines, x, startY, lineHeight) {
  return lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineHeight}">${escXml(l)}</tspan>`).join("");
}

// Multi-color hook/outro headline: if `emphasisLine` (0-based index) is
// given, that wrapped line renders in the accent color; every other line
// renders in primaryText. This is what produces the "Verstappen's / Horror
// Crash / Shocks Home Fans" three-tone treatment.
function tspansEmphasis(lines, x, startY, lineHeight, emphasisLine, accent, normal) {
  return lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineHeight}" fill="${i === emphasisLine ? accent : normal}">${escXml(l)}</tspan>`).join("");
}

function fitStatFontSize(text, maxWidth, baseSize) {
  const estCharWidth = 0.66; // Inter Black digits
  const estWidth = String(text).length * baseSize * estCharWidth;
  if (estWidth <= maxWidth) return baseSize;
  return Math.floor(baseSize * (maxWidth / estWidth));
}

function gradientDefs(p, w, h) {
  return `<linearGradient id="bgGrad" x1="0" y1="0" x2="${w}" y2="${h}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${p.backgroundStart}"/>
    <stop offset="100%" stop-color="${p.backgroundEnd}"/>
  </linearGradient>`;
}

// Legibility scrim for photo backgrounds. `strength` (0-1) scales how dark
// it gets — driven by the photo's measured brightness so a bright photo
// gets darkened more than an already-dark one.
function scrimDefs(w, h, strength) {
  const top = 0.25 + strength * 0.25;
  const bot = 0.65 + strength * 0.3;
  return `<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#000000" stop-opacity="${top.toFixed(2)}"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="${Math.min(bot,0.92).toFixed(2)}"/>
  </linearGradient>`;
}

function backgroundLayer(p, f, scrimStrength) {
  if (scrimStrength != null) return `<defs>${scrimDefs(f.w, f.h, scrimStrength)}</defs><rect width="${f.w}" height="${f.h}" fill="url(#scrim)"/>`;
  return `<defs>${gradientDefs(p, f.w, f.h)}</defs><rect width="${f.w}" height="${f.h}" fill="url(#bgGrad)"/>`;
}

// ── Header ────────────────────────────────────────────────────────────
// Plain variant (body/outro slides): [icon] CATEGORY | divider ... counter,
// with a segmented progress-dash row underneath.
function plainHeader(p, f, categoryName, slug, slideNum, totalSlides) {
  const m = f.margin;
  const icon = categoryIconSVG(slug);
  const dashCount = Math.max(totalSlides || 1, 1);
  const dashW = 26, dashGap = 6, dashH = 4;
  const dashes = Array.from({ length: dashCount }).map((_, i) =>
    `<rect x="${m + i * (dashW + dashGap)}" y="${f.dashY}" width="${dashW}" height="${dashH}" rx="2" fill="${i < (slideNum||1) ? p.accent : p.muted}" opacity="${i < (slideNum||1) ? 1 : 0.4}"/>`
  ).join("");
  return `
    <g transform="translate(${m},${f.headerY - 20})" color="${p.accent}">${icon}</g>
    <text x="${m + 50}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.primaryText}" letter-spacing="1.5">${escXml((categoryName||"").toUpperCase())}</text>
    <text x="${f.w - m}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.secondaryText}" text-anchor="end">${slideNum||1} / ${totalSlides||1}</text>
    ${dashes}`;
}

// Pill variant (hook slide): outlined badge around [icon] CATEGORY.
function pillHeader(p, f, categoryName, slug, slideNum, totalSlides) {
  const m = f.margin;
  const label = (categoryName||"").toUpperCase();
  const pillW = 84 + label.length * 19;
  const icon = categoryIconSVG(slug);
  return `
    <rect x="${m}" y="${f.headerY-34}" width="${pillW}" height="52" rx="26" fill="none" stroke="${p.accent}" stroke-width="2"/>
    <g transform="translate(${m+20},${f.headerY-16})" color="${p.accent}">${icon}</g>
    <text x="${m+58}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.primaryText}" letter-spacing="1.5">${escXml(label)}</text>
    <text x="${f.w - m}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.secondaryText}" text-anchor="end">${slideNum||1} / ${totalSlides||1}</text>`;
}

// Fading accent line + swipe cue, used at the foot of hook slides.
function swipeFooter(p, f) {
  const m = f.margin, y = f.h - 60, lineY = f.h - 34;
  const textEndX = f.w - m - 46; // leave room for the two chevrons after the text
  return `
    <text x="${textEndX}" y="${y}" font-family="${FONT_SANS}" font-size="24" font-weight="700" letter-spacing="2" fill="${p.primaryText}" text-anchor="end">SWIPE TO CONTINUE</text>
    <path d="M ${textEndX+12} ${y-8} L ${textEndX+22} ${y} L ${textEndX+12} ${y+8}" stroke="${p.accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${textEndX+22} ${y-8} L ${textEndX+32} ${y} L ${textEndX+22} ${y+8}" stroke="${p.accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    <defs><linearGradient id="fadeLine" x1="${m}" y1="0" x2="${f.w-m}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="1"/><stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="${m}" y="${lineY}" width="${f.w-2*m}" height="3" fill="url(#fadeLine)"/>`;
}

function swipeArrow(p, f, x, y) {
  return `<text x="${x}" y="${y}" font-family="${FONT_SANS}" font-size="24" font-weight="700" letter-spacing="2" fill="${p.accent}" text-anchor="end">SWIPE</text>
    <path d="M ${x+14} ${y-8} L ${x+26} ${y} L ${x+14} ${y+8}" stroke="${p.accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// ── Slides ────────────────────────────────────────────────────────────

function renderHookSVG(p, f, slide, category, scrimStrength) {
  const m = f.margin;
  const { lines, size } = fitMultilineText(slide.headline, f.hookHeadlineSize, f.hookHeadlineChars, f.hookMaxLines);
  const lineH = Math.round(f.hookHeadlineLine * (size / f.hookHeadlineSize));
  const startY = Math.round(f.h * f.hookHeadlineY);
  const emphasisIdx = slide.emphasisLine != null ? slide.emphasisLine : (lines.length >= 3 ? 1 : -1);
  const supportY = startY + lines.length * lineH + f.hookSupportGap;
  const supportLines = slide.supportingText ? wrapWords(slide.supportingText, f.hookSupportChars).slice(0, 2) : [];

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength)}
    ${pillHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    <text x="${m}" y="${startY}" font-family="${FONT_SERIF}" font-style="italic" font-size="${size}" font-weight="700">${tspansEmphasis(lines, m, startY, lineH, emphasisIdx, p.accent, p.primaryText)}</text>
    ${supportLines.length ? `<text x="${m}" y="${supportY}" font-family="${FONT_SANS}" font-size="${f.hookSupportSize}" fill="${p.secondaryText}">${tspans(supportLines, m, supportY, f.hookSupportLine)}</text>` : ""}
    ${swipeFooter(p, f)}
  </svg>`;
}

function renderBodySVG(p, f, slide, category, scrimStrength) {
  const m = f.margin;
  const hasStat = slide.stat != null && String(slide.stat).trim() !== "";
  const statFontSize = hasStat ? fitStatFontSize(slide.stat, f.w - 2*m, f.statSize) : 0;
  const statBaseline = f.statY;
  const statLabelY = statBaseline + f.statLabelGap;

  const headlineStartY = hasStat ? statLabelY + 70 : Math.round(f.h * 0.30);
  const { lines: hLines, size: hSize } = fitMultilineText(slide.headline, f.bodyHeadlineSize, f.bodyHeadlineChars, f.bodyHeadlineMaxLines);
  const hLineH = Math.round(f.bodyHeadlineLine * (hSize / f.bodyHeadlineSize));
  const headlineEndY = headlineStartY + hLines.length * hLineH;

  const dividerY = headlineEndY + 34;
  const sectionLabelY = dividerY + 46;
  const bodyStartY = slide.sectionLabel ? sectionLabelY + 44 : dividerY + 50;
  const { lines: bLines, size: bSize } = slide.body ? fitMultilineText(slide.body, f.bodyTextSize, f.bodyTextChars, f.bodyTextMaxLines) : { lines: [], size: f.bodyTextSize };
  const bLineH = Math.round(f.bodyTextLine * (bSize / f.bodyTextSize));

  const footerDividerY = f.h - 110;
  const footerY = f.h - 66;

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength)}
    ${plainHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    ${hasStat ? `
    <text x="${m}" y="${statBaseline}" font-family="${FONT_SANS}" font-size="${statFontSize}" font-weight="900" fill="${p.accent}">${escXml(slide.stat)}</text>
    ${slide.statLabel ? `<text x="${m}" y="${statLabelY}" font-family="${FONT_SANS}" font-size="${f.statLabelSize}" font-weight="700" letter-spacing="1.5" fill="${p.secondaryText}">${escXml((slide.statLabel||"").toUpperCase())}</text>` : ""}` : ""}
    <text x="${m}" y="${headlineStartY}" font-family="${FONT_SANS}" font-size="${hSize}" font-weight="800" fill="${p.primaryText}">${tspans(hLines, m, headlineStartY, hLineH)}</text>
    ${slide.body ? `
    <rect x="${m}" y="${dividerY}" width="130" height="3" fill="${p.accent}" opacity="0.5"/>
    ${slide.sectionLabel ? `<rect x="${m}" y="${sectionLabelY-20}" width="4" height="24" fill="${p.accent}"/><text x="${m+18}" y="${sectionLabelY}" font-family="${FONT_SANS}" font-size="${f.sectionLabelSize}" font-weight="700" letter-spacing="1.5" fill="${p.primaryText}">${escXml((slide.sectionLabel||"").toUpperCase())}</text>` : ""}
    <text x="${m}" y="${bodyStartY}" font-family="${FONT_SANS}" font-size="${bSize}" fill="${p.secondaryText}">${tspans(bLines, m, bodyStartY, bLineH)}</text>
    ` : ""}
    <rect x="${m}" y="${footerDividerY}" width="${f.w-2*m}" height="1" fill="${p.muted}" opacity="0.4"/>
    ${slide.tag ? `<rect x="${m}" y="${footerY-32}" width="${40+slide.tag.length*15}" height="44" rx="22" fill="none" stroke="${p.muted}" stroke-width="1.5"/><text x="${m+20}" y="${footerY-4}" font-family="${FONT_SANS}" font-size="22" font-weight="600" letter-spacing="1" fill="${p.secondaryText}">${escXml((slide.tag||"").toUpperCase())}</text>` : ""}
    ${swipeArrow(p, f, f.w - m, footerY - 4)}
  </svg>`;
}

function renderOutroSVG(p, f, slide, category, scrimStrength) {
  const m = f.margin;
  const { lines, size } = fitMultilineText(slide.headline, f.outroHeadlineSize, f.outroHeadlineChars, f.outroMaxLines);
  const lineH = Math.round(f.outroHeadlineLine * (size / f.outroHeadlineSize));
  const blockH = lines.length * lineH;
  const startY = Math.round(f.h/2 - blockH/2);
  const supportLines = slide.supportingText ? wrapWords(slide.supportingText, f.hookSupportChars).slice(0, 2) : [];
  const supportY = startY + blockH + 56;
  const emphasisIdx = slide.emphasisLine != null ? slide.emphasisLine : (lines.length >= 2 ? lines.length - 1 : -1);

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength)}
    ${plainHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    <text x="${m}" y="${startY}" font-family="${FONT_SERIF}" font-style="italic" font-size="${size}" font-weight="700">${tspansEmphasis(lines, m, startY, lineH, emphasisIdx, p.accent, p.primaryText)}</text>
    ${supportLines.length ? `<text x="${m}" y="${supportY}" font-family="${FONT_SANS}" font-size="${f.hookSupportSize}" fill="${p.secondaryText}">${tspans(supportLines, m, supportY, f.hookSupportLine)}</text>` : ""}
    <defs><linearGradient id="fadeLine2" x1="${m}" y1="0" x2="${f.w-m}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="1"/><stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="${m}" y="${f.h-70}" width="${f.w-2*m}" height="3" fill="url(#fadeLine2)"/>
  </svg>`;
}

function resolveType(slide, index, total) {
  const t = slide.type || slide.role;
  if (t === "hook" || t === "body" || t === "outro") return t;
  if (index === 0) return "hook";
  if (index === total - 1 && total > 1) return "outro";
  return "body";
}

// Fetches + cover-crops a background photo, and measures its average
// brightness so the scrim can darken proportionally (a bright photo needs a
// stronger overlay than an already-dark one to keep text legible).
async function fetchCoverImage(imageUrl, w, h) {
  if (!imageUrl) return null;
  try {
    const r = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000 });
    if (!r.ok) return null;
    const buf = await r.buffer();
    const cover = await sharp(buf).resize(w, h, { fit: "cover", position: "attention" }).jpeg({ quality: 90 }).toBuffer();
    const stats = await sharp(cover).stats();
    const avgLum = stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3 / 255; // 0-1
    return { buffer: cover, brightness: avgLum };
  } catch (e) {
    return null;
  }
}

async function renderStatCard(slide, category, paletteKey, format, imageUrl) {
  const p = resolvePalette(paletteKey);
  const f = resolveFormat(format);
  const type = resolveType(slide, (slide.slideNumber || 1) - 1, slide.totalSlides || 1);
  const cat = typeof category === "string" ? { displayName: category, slug: "default" } : (category || { displayName: "", slug: "default" });

  // Mode B: hook photo, adaptive scrim. Mode A otherwise (gradient).
  const cover = type === "hook" ? await fetchCoverImage(imageUrl, f.w, f.h) : null;
  const scrimStrength = cover ? cover.brightness : null;

  const svg = type === "hook" ? renderHookSVG(p, f, slide, cat, scrimStrength)
    : type === "outro" ? renderOutroSVG(p, f, slide, cat, scrimStrength)
    : renderBodySVG(p, f, slide, cat, scrimStrength);

  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();
  if (!cover) return textLayer;
  return sharp(cover.buffer).composite([{ input: textLayer }]).png().toBuffer();
}

async function renderCardSet(slides, category, paletteKey, format, imageUrl) {
  const total = slides.length;
  const buffers = await Promise.all(
    slides.map((s, i) => renderStatCard({ ...s, slideNumber: i + 1, totalSlides: total }, category, paletteKey, format, imageUrl))
  );
  return buffers.map(b => `data:image/png;base64,${b.toString("base64")}`);
}

module.exports = { renderStatCard, renderCardSet, PALETTE, DEFAULT_PALETTE, CATEGORY_ICON, CATEGORY_ICON_OVERRIDES };
