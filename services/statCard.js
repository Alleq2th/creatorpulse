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
const fs = require("fs");
const path = require("path");

const FONT_SERIF = "'Anton', 'Archivo Black', Impact, sans-serif"; // hook/body/outro headlines — bold, upright, blocky (not the previous italic serif)
const FONT_SANS = "Inter, sans-serif";                    // everything else — weight via font-weight

// ── Formats ────────────────────────────────────────────────────────────
const FORMATS = {
  instagram: {
    w: 1080, h: 1350,
    margin: 76,
    headerY: 90, dashY: 122, dashW: owidth => 0, // computed inline
    hookHeadlineY: 0.37, hookHeadlineSize: 84, hookHeadlineLine: 92, hookHeadlineChars: 16, hookMaxLines: 4,
    hookSupportGap: 56, hookSupportSize: 32, hookSupportLine: 44, hookSupportChars: 56, hookSupportMaxLines: 3,
    statY: 470, statSize: 210, statLabelGap: 46, statLabelSize: 26,
    bodyHeadlineSize: 66, bodyHeadlineLine: 74, bodyHeadlineChars: 23, bodyHeadlineMaxLines: 3,
    sectionLabelSize: 24, bodyTextSize: 28, bodyTextLine: 40, bodyTextChars: 58, bodyTextMaxLines: 6,
    outroHeadlineSize: 76, outroHeadlineLine: 84, outroHeadlineChars: 17, outroMaxLines: 4,
  },
  tiktok: {
    w: 1080, h: 1920,
    margin: 76,
    headerY: 96, dashY: 130,
    hookHeadlineY: 0.36, hookHeadlineSize: 92, hookHeadlineLine: 100, hookHeadlineChars: 15, hookMaxLines: 4,
    hookSupportGap: 60, hookSupportSize: 34, hookSupportLine: 46, hookSupportChars: 52, hookSupportMaxLines: 3,
    statY: 620, statSize: 240, statLabelGap: 50, statLabelSize: 28,
    bodyHeadlineSize: 72, bodyHeadlineLine: 80, bodyHeadlineChars: 21, bodyHeadlineMaxLines: 3,
    sectionLabelSize: 26, bodyTextSize: 30, bodyTextLine: 44, bodyTextChars: 52, bodyTextMaxLines: 7,
    outroHeadlineSize: 84, outroHeadlineLine: 92, outroHeadlineChars: 16, outroMaxLines: 4,
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
  gold:          { name: "Gold",          backgroundStart: "#0B0A06", backgroundEnd: "#241C0B", accent: "#E8B93D", primaryText: "#F7F4EB", secondaryText: "#C7BEA3", muted: "#84795A" },
  hot_pink:      { name: "Hot Pink",      backgroundStart: "#0D080B", backgroundEnd: "#2B0F20", accent: "#F7368A", primaryText: "#FAF0F5", secondaryText: "#CCADBE", muted: "#877080" },
  sky_blue:      { name: "Sky Blue",      backgroundStart: "#070B0D", backgroundEnd: "#0D2530", accent: "#38BDF8", primaryText: "#F1F8FB", secondaryText: "#A9C4CE", muted: "#6C848D" },
  deep_teal:     { name: "Deep Teal",     backgroundStart: "#06100E", backgroundEnd: "#0B2C28", accent: "#14B8A6", primaryText: "#EFFAF8", secondaryText: "#A6C7C1", muted: "#688683" },
  royal_indigo:  { name: "Royal Indigo",  backgroundStart: "#08080F", backgroundEnd: "#161235", accent: "#6366F1", primaryText: "#F2F2FA", secondaryText: "#B7B7D6", muted: "#75758F" },
  sunset_coral:  { name: "Sunset Coral",  backgroundStart: "#0D0907", backgroundEnd: "#2E160B", accent: "#FB7A4C", primaryText: "#FAF3EF", secondaryText: "#D0B4A5", muted: "#8C7166" },
  white_platinum:{ name: "White Platinum",backgroundStart: "#0A0A0B", backgroundEnd: "#1D1D20", accent: "#E5E5EA", primaryText: "#FAFAFA", secondaryText: "#B8B8C0", muted: "#77777E" }

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

// Same idea as fitMultilineText but for short single-size supporting text
// (teases, CTAs) — was previously a naked wrapWords(...).slice(0,2), which
// silently dropped any words past line 2 with no ellipsis. That produced
// sentences that just stopped mid-thought with no indication of truncation.
function fitSupportText(text, chars, maxLines) {
  const lines = wrapWords(text, chars);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  const last = clipped[maxLines - 1];
  clipped[maxLines - 1] = last.length > chars - 1 ? last.slice(0, chars - 1).trimEnd() + "…" : last + "…";
  return clipped;
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

// Decorative texture for slides using the flat gradient (no photo) — a large
// soft accent-color glow plus a few thin diagonal lines. This is what was
// missing on body/outro slides: they had zero visual interest besides flat
// color, which is why short stories read as "empty" no matter how centered
// the text was. Seeded by slide type so hook/body/outro don't look identical.
function decorativeTexture(p, f, seed) {
  const cx = seed === "outro" ? f.w * 0.82 : f.w * 0.15;
  const cy = seed === "outro" ? f.h * 0.12 : f.h * 0.88;
  const lines = Array.from({length: 5}).map((_, i) => {
    const off = i * 90;
    return `<line x1="${-200+off}" y1="${f.h}" x2="${200+off}" y2="0" stroke="${p.accent}" stroke-width="2" opacity="0.05"/>`;
  }).join("");
  return `
  <defs>
    <radialGradient id="glow" cx="${cx}" cy="${cy}" r="${f.w*0.55}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${f.w}" height="${f.h}" fill="url(#glow)"/>
  ${lines}`;
}

function backgroundLayer(p, f, scrimStrength, slideType) {
  if (scrimStrength != null) return `<defs>${scrimDefs(f.w, f.h, scrimStrength)}</defs><rect width="${f.w}" height="${f.h}" fill="url(#scrim)"/>`;
  return `<defs>${gradientDefs(p, f.w, f.h)}</defs><rect width="${f.w}" height="${f.h}" fill="url(#bgGrad)"/>${decorativeTexture(p, f, slideType)}`;
}

// ── Header ────────────────────────────────────────────────────────────
// Plain variant (body/outro slides): [icon] CATEGORY | divider ... counter,
// with a segmented progress-dash row underneath.
function plainHeader(p, f, categoryName, slug, slideNum, totalSlides) {
  const m = f.margin;
  const icon = categoryIconSVG(slug);
  const isSinglePost = (totalSlides || 1) <= 1;
  // A carousel-style "1 / 1" counter and progress-dash row read as broken
  // chrome on a genuinely single post (that's part of what was making the
  // TikTok single graphic look "weird" — it visually implied a carousel
  // that never advances). Skip both when there's nothing to progress through.
  const dashCount = Math.max(totalSlides || 1, 1);
  const dashW = 26, dashGap = 6, dashH = 4;
  const dashes = isSinglePost ? "" : Array.from({ length: dashCount }).map((_, i) =>
    `<rect x="${m + i * (dashW + dashGap)}" y="${f.dashY}" width="${dashW}" height="${dashH}" rx="2" fill="${i < (slideNum||1) ? p.accent : p.muted}" opacity="${i < (slideNum||1) ? 1 : 0.4}"/>`
  ).join("");
  return `
    <g transform="translate(${m},${f.headerY - 20})" color="${p.accent}">${icon}</g>
    <text x="${m + 50}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.primaryText}" letter-spacing="1.5">${escXml((categoryName||"").toUpperCase())}</text>
    ${isSinglePost ? "" : `<text x="${f.w - m}" y="${f.headerY}" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${p.secondaryText}" text-anchor="end">${slideNum||1} / ${totalSlides||1}</text>`}
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
  const supportLines = slide.supportingText ? fitSupportText(slide.supportingText, f.hookSupportChars, f.hookSupportMaxLines) : [];

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength, "hook")}
    ${pillHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    <text x="${m}" y="${startY}" font-family="${FONT_SERIF}" font-size="${size}" font-weight="700">${tspansEmphasis(lines, m, startY, lineH, emphasisIdx, p.accent, p.primaryText)}</text>
    ${supportLines.length ? `<text x="${m}" y="${supportY}" font-family="${FONT_SANS}" font-size="${f.hookSupportSize}" fill="${p.secondaryText}">${tspans(supportLines, m, supportY, f.hookSupportLine)}</text>` : ""}
    ${swipeFooter(p, f)}
  </svg>`;
}

// ── Body slide composition variants ─────────────────────────────────────
// Which one a slide uses is decided by which fields the AI actually filled
// in for that slide's content — never forced, so a plain paragraph story
// still just gets a paragraph. Precedence when multiple are present:
// quote > timeline > facts > stat > plain paragraph.
function detectBodyVariant(slide) {
  if (slide.quote && String(slide.quote).trim()) return "quote";
  if (Array.isArray(slide.timeline) && slide.timeline.length) return "timeline";
  if (Array.isArray(slide.facts) && slide.facts.length) return "facts";
  if (slide.stat != null && String(slide.stat).trim() !== "") return "stat";
  return "standard";
}

function measureFacts(f, facts) {
  const rows = facts.slice(0, 4).map(fact => wrapWords(String(fact), f.bodyTextChars).slice(0, 2));
  const rowH = rows.map(lines => 26 + lines.length * f.bodyTextLine * 0.82);
  return { rows, height: rowH.reduce((a,b) => a+b, 0) + (rows.length - 1) * 14 };
}
function renderFacts(m, f, p, rows, startY) {
  let y = startY;
  const out = [];
  rows.forEach((lines, i) => {
    const bSize = Math.round(f.bodyTextSize * 0.82);
    const lineH = Math.round(f.bodyTextLine * 0.82);
    out.push(`<circle cx="${m+10}" cy="${y - bSize*0.35}" r="5" fill="${p.accent}"/>`);
    out.push(`<text x="${m+34}" y="${y}" font-family="${FONT_SANS}" font-size="${bSize}" fill="${p.secondaryText}">${tspans(lines, m+34, y, lineH)}</text>`);
    y += lines.length * lineH + 40;
  });
  return out.join("");
}

function measureQuote(f, quote, attribution) {
  const size = Math.round(f.bodyHeadlineSize * 0.62);
  const lineH = Math.round(size * 1.28);
  const lines = wrapWords(String(quote), Math.round(f.bodyHeadlineChars * 1.3)).slice(0, 4);
  return { lines, size, lineH, height: 50 + lines.length * lineH + (attribution ? 44 : 0) };
}
function renderQuote(m, f, p, quote, attribution, startY) {
  const { lines, size, lineH } = measureQuote(f, quote, attribution);
  const textY = startY + 56;
  return `
    <text x="${m-6}" y="${startY+40}" font-family="${FONT_SERIF}" font-size="90" fill="${p.accent}" opacity="0.35">"</text>
    <text x="${m}" y="${textY}" font-family="${FONT_SERIF}" font-size="${size}" fill="${p.primaryText}">${tspans(lines, m, textY, lineH)}</text>
    ${attribution ? `<text x="${m}" y="${textY + lines.length*lineH + 36}" font-family="${FONT_SANS}" font-size="24" font-weight="700" letter-spacing="1" fill="${p.secondaryText}">${escXml(("— "+attribution).toUpperCase())}</text>` : ""}`;
}

function measureTimeline(f, items) {
  const rows = items.slice(0, 4).map(it => wrapWords(String(it.text||""), f.bodyTextChars - 4).slice(0, 2));
  const rowH = rows.map(lines => 46 + lines.length * f.bodyTextLine * 0.8);
  return { rows, height: rowH.reduce((a,b)=>a+b,0) + (rows.length-1)*10 };
}
function renderTimeline(m, f, p, items, rows, startY) {
  let y = startY;
  const railX = m + 4;
  const out = [];
  const totalH = rows.reduce((s,lines,i) => s + 46 + lines.length * f.bodyTextLine * 0.8 + (i>0?10:0), 0);
  out.push(`<line x1="${railX}" y1="${startY - 24}" x2="${railX}" y2="${startY - 24 + totalH}" stroke="${p.muted}" stroke-width="2" opacity="0.4"/>`);
  items.slice(0, 4).forEach((it, i) => {
    const lines = rows[i];
    const bSize = Math.round(f.bodyTextSize * 0.82);
    const lineH = Math.round(f.bodyTextLine * 0.8);
    out.push(`<circle cx="${railX}" cy="${y - bSize*0.7}" r="7" fill="${p.accent}"/>`);
    out.push(`<text x="${m+34}" y="${y - bSize*0.55}" font-family="${FONT_SANS}" font-size="22" font-weight="700" letter-spacing="1" fill="${p.accent}">${escXml((it.label||"").toUpperCase())}</text>`);
    out.push(`<text x="${m+34}" y="${y + bSize*0.5}" font-family="${FONT_SANS}" font-size="${bSize}" fill="${p.secondaryText}">${tspans(lines, m+34, y+bSize*0.5, lineH)}</text>`);
    y += 46 + lines.length * lineH;
  });
  return out.join("");
}

function renderBodySVG(p, f, slide, category, scrimStrength) {
  const m = f.margin;
  const variant = detectBodyVariant(slide);
  const hasStat = variant === "stat";
  const statFontSize = hasStat ? fitStatFontSize(slide.stat, f.w - 2*m, f.statSize) : 0;

  // Vertical rhythm, top to bottom: header → section label (small) →
  // headline (large, dominant) → variant-specific middle content → footer.
  // The whole block is vertically CENTERED in the space between header and
  // footer so short content doesn't leave a dead gap above the footer.
  const { lines: hLines, size: hSize } = fitMultilineText(slide.headline, f.bodyHeadlineSize, f.bodyHeadlineChars, f.bodyHeadlineMaxLines);
  const hLineH = Math.round(f.bodyHeadlineLine * (hSize / f.bodyHeadlineSize));
  const { lines: bLines, size: bSize } = ((variant === "standard" || variant === "stat") && slide.body) ? fitMultilineText(slide.body, f.bodyTextSize, f.bodyTextChars, f.bodyTextMaxLines) : { lines: [], size: f.bodyTextSize };
  const bLineH = Math.round(f.bodyTextLine * (bSize / f.bodyTextSize));

  let factsData = null, timelineData = null;
  if (variant === "facts") factsData = measureFacts(f, slide.facts);
  if (variant === "timeline") timelineData = measureTimeline(f, slide.timeline);
  const quoteData = variant === "quote" ? measureQuote(f, slide.quote, slide.quoteAttribution) : null;

  const sectionBlockH = slide.sectionLabel ? 56 : 0;
  const headlineBlockH = hLines.length * hLineH;
  const middleBlockH =
    variant === "quote" ? 40 + quoteData.height :
    variant === "timeline" ? 64 + timelineData.height :
    variant === "facts" ? 64 + factsData.height :
    variant === "stat" ? 64 + statFontSize * 0.78 + f.statLabelGap + 60 + (slide.body ? 60 + bLines.length * bLineH : 0) :
    64 + (slide.body ? bLines.length * bLineH : 0);
  const totalContentH = sectionBlockH + headlineBlockH + middleBlockH;

  // A ctaLine ("FOLLOW FOR MORE →") means this slide is doing double duty as
  // both the last piece of story AND the carousel's ending — used for short
  // carousels (under 6 slides) instead of spending an entire separate slide
  // on a CTA when there's barely been any story yet. Reserve extra room
  // above the footer for it, and pull the divider up to match.
  const hasCtaLine = !!slide.ctaLine;
  const headerBottom = f.headerY + 70; // clear of the category header + progress dashes
  const footerDividerY = f.h - 110 - (hasCtaLine ? 86 : 0);
  const footerY = f.h - 66 - (hasCtaLine ? 86 : 0);
  const availableH = footerDividerY - 60 - headerBottom;
  const blockTopY = headerBottom + Math.max(0, (availableH - totalContentH) / 2);

  const sectionLabelY = blockTopY + (slide.sectionLabel ? 20 : -24);
  const headlineStartY = sectionLabelY + sectionBlockH + hSize * 0.78;
  const headlineEndY = headlineStartY + (hLines.length - 1) * hLineH;
  const afterHeadlineY = headlineEndY + 64;

  let middleSVG = "";
  if (variant === "quote") {
    middleSVG = renderQuote(m, f, p, slide.quote, slide.quoteAttribution, afterHeadlineY);
  } else if (variant === "timeline") {
    middleSVG = renderTimeline(m, f, p, slide.timeline, timelineData.rows, afterHeadlineY + 30);
  } else if (variant === "facts") {
    middleSVG = renderFacts(m, f, p, factsData.rows, afterHeadlineY + 20);
  } else if (variant === "stat") {
    const statBaseline = afterHeadlineY + statFontSize * 0.78;
    const statLabelY = statBaseline + f.statLabelGap;
    const bodyStartY = statLabelY + 60;
    middleSVG = `
    <text x="${m}" y="${statBaseline}" font-family="${FONT_SANS}" font-size="${statFontSize}" font-weight="900" fill="${p.accent}">${escXml(slide.stat)}</text>
    ${slide.statLabel ? `<text x="${m}" y="${statLabelY}" font-family="${FONT_SANS}" font-size="${f.statLabelSize}" font-weight="700" letter-spacing="1.5" fill="${p.secondaryText}">${escXml((slide.statLabel||"").toUpperCase())}</text>` : ""}
    ${slide.body ? `<text x="${m}" y="${bodyStartY}" font-family="${FONT_SANS}" font-size="${bSize}" fill="${p.secondaryText}">${tspans(bLines, m, bodyStartY, bLineH)}</text>` : ""}`;
  } else if (slide.body) {
    middleSVG = `
    <rect x="${m}" y="${afterHeadlineY - bSize - 20}" width="130" height="3" fill="${p.accent}" opacity="0.5"/>
    <text x="${m}" y="${afterHeadlineY}" font-family="${FONT_SANS}" font-size="${bSize}" fill="${p.secondaryText}">${tspans(bLines, m, afterHeadlineY, bLineH)}</text>`;
  }

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength, "body")}
    ${plainHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    ${slide.sectionLabel ? `<rect x="${m}" y="${sectionLabelY-20}" width="4" height="24" fill="${p.accent}"/><text x="${m+18}" y="${sectionLabelY}" font-family="${FONT_SANS}" font-size="${f.sectionLabelSize}" font-weight="700" letter-spacing="1.5" fill="${p.accent}">${escXml((slide.sectionLabel||"").toUpperCase())}</text>` : ""}
    <text x="${m}" y="${headlineStartY}" font-family="${FONT_SERIF}" font-size="${hSize}" font-weight="400" fill="${p.primaryText}">${tspans(hLines, m, headlineStartY, hLineH)}</text>
    ${middleSVG}
    ${hasCtaLine ? `<text x="${m}" y="${footerDividerY - 32}" font-family="${FONT_SERIF}" font-size="34" fill="${p.accent}">${escXml((slide.ctaLine||"").toUpperCase())}</text>` : ""}
    <rect x="${m}" y="${footerDividerY}" width="${f.w-2*m}" height="1" fill="${p.muted}" opacity="0.4"/>
    ${slide.tag ? `<rect x="${m}" y="${footerY-32}" width="${40+slide.tag.length*15}" height="44" rx="22" fill="none" stroke="${p.muted}" stroke-width="1.5"/><text x="${m+20}" y="${footerY-4}" font-family="${FONT_SANS}" font-size="22" font-weight="600" letter-spacing="1" fill="${p.secondaryText}">${escXml((slide.tag||"").toUpperCase())}</text>` : ""}
    ${hasCtaLine ? "" : swipeArrow(p, f, f.w - m, footerY - 4)}
  </svg>`;
}

function renderOutroSVG(p, f, slide, category, scrimStrength) {
  const m = f.margin;
  const { lines, size } = fitMultilineText(slide.headline, f.outroHeadlineSize, f.outroHeadlineChars, f.outroMaxLines);
  const lineH = Math.round(f.outroHeadlineLine * (size / f.outroHeadlineSize));
  const blockH = lines.length * lineH;
  const startY = Math.round(f.h/2 - blockH/2);
  const supportLines = slide.supportingText ? fitSupportText(slide.supportingText, f.hookSupportChars, f.hookSupportMaxLines) : [];
  const supportY = startY + blockH + 56;
  const emphasisIdx = slide.emphasisLine != null ? slide.emphasisLine : (lines.length >= 2 ? lines.length - 1 : -1);

  return `
  <svg width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}" xmlns="http://www.w3.org/2000/svg">
    ${backgroundLayer(p, f, scrimStrength, "outro")}
    ${plainHeader(p, f, category.displayName, category.slug, slide.slideNumber, slide.totalSlides)}
    <text x="${m}" y="${startY}" font-family="${FONT_SERIF}" font-size="${size}" font-weight="700">${tspansEmphasis(lines, m, startY, lineH, emphasisIdx, p.accent, p.primaryText)}</text>
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

// Local niche background library. Structure per the design spec: each niche
// gets 5 style folders, not one flat dump —
//   assets/backgrounds/<slug>/cinematic/  — dark gradient, safest default
//   assets/backgrounds/<slug>/texture/    — abstract texture/grain
//   assets/backgrounds/<slug>/glow/       — light/glow/spotlight, for hooks
//   assets/backgrounds/<slug>/geometric/  — editorial geometric, for body
//   assets/backgrounds/<slug>/dramatic/   — dark/high-contrast, for CTA/major news
// Drop any .jpg/.jpeg/.png/.webp file into the relevant folder — filename
// doesn't matter, one is picked at random. A slide type maps to its ideal
// style, but if that specific style folder is empty it falls back to
// cinematic (the one style every niche is expected to eventually have),
// then to no local image at all (renderer falls through to the gradient +
// decorative texture, same as today, for niches nobody's uploaded to yet).
const BACKGROUNDS_DIR = path.join(__dirname, "..", "assets", "backgrounds");
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const STYLE_FOR_SLIDE_TYPE = { hook: "glow", body: "geometric", outro: "dramatic" };
function listImages(dir) {
  try {
    return fs.readdirSync(dir).filter(f => IMG_EXT.has(path.extname(f).toLowerCase()));
  } catch (e) {
    return [];
  }
}
function pickLocalBackground(slug, slideType) {
  const niche = slug || "default";
  const preferredStyle = STYLE_FOR_SLIDE_TYPE[slideType] || "cinematic";
  for (const style of [preferredStyle, "cinematic"]) {
    const dir = path.join(BACKGROUNDS_DIR, niche, style);
    const files = listImages(dir);
    if (files.length) return path.join(dir, files[Math.floor(Math.random() * files.length)]);
  }
  return null; // niche has no images in either folder yet — falls through to gradient
}

// Cover-crops + measures brightness for a background image already on disk,
// mirroring fetchCoverImage's output shape so both sources are interchangeable.
async function coverFromLocalFile(filePath, w, h) {
  try {
    const cover = await sharp(filePath).resize(w, h, { fit: "cover", position: "attention" }).jpeg({ quality: 90 }).toBuffer();
    const stats = await sharp(cover).stats();
    const avgLum = stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3 / 255;
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

  // Mode B: photo + adaptive scrim. Falls back through: live article photo
  // (hook slide only — that photo is tied to the specific news story, so it
  // doesn't belong on generic body/outro slides) → local niche background
  // library (any slide type, picked fresh per slide so a carousel doesn't
  // reuse the same image 6 times) → Mode A gradient + decorative texture.
  let cover = type === "hook" ? await fetchCoverImage(imageUrl, f.w, f.h) : null;
  if (!cover) {
    const localPath = pickLocalBackground(cat.slug, type);
    if (localPath) cover = await coverFromLocalFile(localPath, f.w, f.h);
  }
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
