// Stat/carousel card renderer — this deliberately does NOT use AI image
// generation. Diffusion models cannot reliably render legible text (see the
// garbled scribbles in earlier thumbnail output) — that's a structural
// limitation of how those models work, not something better prompting fixes.
// Real text needs real typography: this builds an SVG template with actual
// text nodes, then rasterizes it to PNG with sharp. Every word on the card is
// exactly what was passed in — nothing hallucinated.
const sharp = require("sharp");

const W = 1080, H = 1350; // 4:5, matches carousel format elsewhere in the app
const PALETTE = {
  default:  { bg: "#161616", accent: "#A8452C", text: "#F6F6F6", sub: "#9a9a9a" },
  forest:   { bg: "#161616", accent: "#56754B", text: "#F6F6F6", sub: "#9a9a9a" },
  blue:     { bg: "#161616", accent: "#347AEA", text: "#F6F6F6", sub: "#9a9a9a" }
};

function escXml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// Naive word-wrap by estimated character width — good enough for a card,
// not a full text-layout engine.
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

/**
 * Render one card. slide: { slideNum, totalSlides, title, body, stat, statLabel }
 * niche: string, used for the small tag in the corner.
 * palette: "default" | "forest" | "blue"
 */
async function renderStatCard(slide, niche, palette) {
  const p = PALETTE[palette] || PALETTE.default;
  const titleLines = wrapText(slide.title, 20, 4);
  const bodyLines = wrapText(slide.body, 34, 6);
  const hasStat = slide.stat != null && String(slide.stat).trim() !== "";

  const titleY = hasStat ? 620 : 340;
  const bodyStartY = titleY + titleLines.length * 62 + 60;

  const svg = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${p.bg}"/>
    <rect x="0" y="0" width="${W}" height="10" fill="${p.accent}"/>
    <text x="72" y="90" font-family="sans-serif" font-size="28" font-weight="700" fill="${p.accent}" letter-spacing="2">${escXml((niche||"").toUpperCase())}</text>
    <text x="${W-72}" y="90" font-family="sans-serif" font-size="28" font-weight="700" fill="${p.sub}" text-anchor="end">${slide.slideNum||1} / ${slide.totalSlides||5}</text>
    ${hasStat ? `
    <text x="72" y="480" font-family="serif" font-size="220" font-weight="800" fill="${p.accent}">${escXml(slide.stat)}</text>
    ${slide.statLabel ? `<text x="72" y="530" font-family="sans-serif" font-size="30" fill="${p.sub}">${escXml(slide.statLabel)}</text>` : ""}
    ` : ""}
    <text x="72" y="${titleY}" font-family="serif" font-size="58" font-weight="700" fill="${p.text}" style="line-height:1.15">${tspans(titleLines, 72, titleY, 66)}</text>
    <text x="72" y="${bodyStartY}" font-family="sans-serif" font-size="32" fill="${p.sub}">${tspans(bodyLines, 72, bodyStartY, 44)}</text>
    <rect x="72" y="${H-90}" width="${W-144}" height="4" fill="${p.accent}" opacity="0.4"/>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function renderCardSet(slides, niche, palette) {
  const total = slides.length;
  const buffers = await Promise.all(
    slides.map((s, i) => renderStatCard({ ...s, slideNum: i + 1, totalSlides: total }, niche, palette))
  );
  return buffers.map(b => `data:image/png;base64,${b.toString("base64")}`);
}

module.exports = { renderStatCard, renderCardSet };
