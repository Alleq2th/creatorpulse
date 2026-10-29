// Card themes: named looks for a single generated graphic.
//
// A style theme changes the whole graphic's type, text colour, photo dim and
// accent. A colour theme changes only the text and accent colours. Neither one
// touches the headline, supporting text, call to action, photo, or the text
// positions the user has set on the canvas.
//
// Plain script for the browser (window.CardThemes) and a CommonJS module for tests.
(function (root) {
  const STYLE_THEMES = [
    { id: "dark_editorial", name: "Dark Editorial", typography: "editorial_serif", textColor: "#FFFFFF", accent: "#E8D9B5", dim: 0.45 },
    { id: "electric", name: "Electric", typography: "impact", textColor: "#FFFFFF", accent: "#00E5FF", dim: 0.35 },
    { id: "minimal", name: "Minimal", typography: "modern_sans", textColor: "#F5F5F5", accent: "#F5F5F5", dim: 0.2 },
    { id: "sports_broadcast", name: "Sports Broadcast", typography: "condensed_sans", textColor: "#FFFFFF", accent: "#FFD400", dim: 0.5 },
    { id: "classic_magazine", name: "Classic Magazine", typography: "classic_serif", textColor: "#F7F1E3", accent: "#C9A227", dim: 0.4 }
  ];

  const COLOUR_THEMES = [
    { id: "black_white", name: "Black & White", textColor: "#FFFFFF", accent: "#FFFFFF" },
    { id: "black_electric_blue", name: "Black & Electric Blue", textColor: "#FFFFFF", accent: "#00B3FF" },
    { id: "black_gold", name: "Black & Gold", textColor: "#FFFFFF", accent: "#D4AF37" },
    { id: "red_white", name: "Red & White", textColor: "#FFFFFF", accent: "#E10600" },
    { id: "blue_white", name: "Blue & White", textColor: "#FFFFFF", accent: "#2563EB" },
    { id: "purple_white", name: "Purple & White", textColor: "#FFFFFF", accent: "#9333EA" },
    { id: "neutral_editorial", name: "Neutral Editorial", textColor: "#F5F1EA", accent: "#A8A29E" },
    { id: "high_contrast_sports", name: "High-Contrast Sports", textColor: "#FFFFFF", accent: "#FFD400" }
  ];

  const HEX = /^#[0-9a-f]{6}$/i;
  const clone = (v) => JSON.parse(JSON.stringify(v || {}));
  const findIn = (list, id) => list.find((t) => t.id === id) || null;

  // Keeps the first snapshot of the look so "Restore original look" can return to it.
  function withBaseline(style) {
    const s = clone(style);
    if (!s._themeBase) {
      const base = clone(style);
      delete base._themeBase;
      s._themeBase = base;
    }
    return s;
  }

  // Returns the new style for a style theme, or null if the id is unknown.
  function applyTheme(style, themeId) {
    const t = findIn(STYLE_THEMES, themeId);
    if (!t) return null;
    const s = withBaseline(style);
    s.typography = t.typography;
    s.textColor = t.textColor;
    s.dim = t.dim;
    s.layerFonts = {};            // a whole-graphic theme replaces per-text fonts
    s.layerColors = { ctaLine: t.accent };
    s.themeId = t.id;
    delete s.colourThemeId;
    return s;
  }

  // Returns the new style for a colour theme, or null if the id is unknown.
  // Typography, photo dim and text positions stay as they are.
  function applyColourTheme(style, colourId) {
    const c = findIn(COLOUR_THEMES, colourId);
    if (!c) return null;
    const s = withBaseline(style);
    s.textColor = c.textColor;
    s.layerColors = { ctaLine: c.accent };
    s.colourThemeId = c.id;
    return s;
  }

  // Returns the style as it was before any theme was applied.
  function restore(style) {
    if (!style || !style._themeBase) return { restored: false, style: clone(style) };
    return { restored: true, style: clone(style._themeBase) };
  }

  // The look a gallery tile should show: type, text colour, accent and dim.
  function preview(kind, id, style) {
    const sty = style || {};
    if (kind === "style") {
      const t = findIn(STYLE_THEMES, id);
      return t ? { typography: t.typography, textColor: t.textColor, accent: t.accent, dim: t.dim } : null;
    }
    const c = findIn(COLOUR_THEMES, id);
    return c ? { typography: sty.typography || "impact", textColor: c.textColor, accent: c.accent, dim: Number(sty.dim) || 0 } : null;
  }

  const api = {
    STYLE_THEMES,
    COLOUR_THEMES,
    isHex: (v) => HEX.test(String(v || "")),
    applyTheme,
    applyColourTheme,
    restore,
    preview,
    themeName: (id) => (findIn(STYLE_THEMES, id) || {}).name || "",
    colourName: (id) => (findIn(COLOUR_THEMES, id) || {}).name || ""
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CardThemes = api;
})(typeof window !== "undefined" ? window : globalThis);
