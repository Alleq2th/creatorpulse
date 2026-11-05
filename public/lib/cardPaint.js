/* CreatorPulse · DOM painters for the live card preview.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The preview used to build its decoration (the accent badge, rule, frame, orb,
 * stripes) inline inside cpUpdateLiveStage, with `inset:0` plus left/top. An
 * absolutely positioned element with `inset:0` and only left/top overridden
 * still stretches to the bottom-right corner — that is the giant coloured blob
 * that covered the card. Sizing is now computed once in public/lib/cardLayout.js
 * (in card pixels, clamped) and this file only paints it.
 *
 * Every painter here takes the resolved layout object and nothing else, so the
 * preview and the export cannot disagree about where a thing goes.
 */
(function (root) {
  'use strict';

  /* Paints the template decoration into `el`, a .cc-live-decoration div that is
   * a direct child of the card stage. `design` is a CPCardLayout.resolve()
   * result. Sizes are converted from card pixels to percentages of the stage,
   * so the pill stays pill-sized at any preview width. */
  function paintDecoration(el, design) {
    if (!el) return;
    var d = (design && design.decoration) || { type: 'none' };
    var canvas = (design && design.canvas) || { width: 1080, height: 1350 };
    var W = canvas.width, H = canvas.height;

    // Reset everything a previous template may have set. Without this, switching
    // Instagram <-> TikTok (or template A -> B) leaves stale geometry behind.
    el.className = 'cc-live-decoration';
    el.textContent = '';
    el.removeAttribute('style');
    el.hidden = d.type === 'none';
    if (d.type === 'none') return;

    var pct = function (px, total) { return (px / total * 100).toFixed(3) + '%'; };
    var base = {
      position: 'absolute',
      zIndex: '2',
      pointerEvents: 'none',
      boxSizing: 'border-box'
    };
    var apply = function (extra) {
      Object.keys(base).forEach(function (k) { el.style[k] = base[k]; });
      Object.keys(extra).forEach(function (k) { el.style[k] = extra[k]; });
    };

    if (d.type === 'badge') {
      el.textContent = d.text;
      apply({
        left: pct(d.x, W),
        top: pct(d.y, H),
        // Fixed pixel size derived from the card, NOT from the container: the
        // badge is a pill, never a block that fills the card.
        width: pct(d.width, W),
        height: pct(d.height, H),
        maxWidth: pct(d.width, W),
        maxHeight: pct(d.height, H),
        borderRadius: pct(d.radius, W),
        background: d.bg,
        color: (design.palette && design.palette.bg) || '#000',
        font: '800 ' + (d.fontSize / W * 100).toFixed(3) + 'cqw/1 Inter, sans-serif',
        letterSpacing: '.08em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      });
      return;
    }
    if (d.type === 'rule') {
      apply({ left: pct(d.x, W), top: pct(d.y, H), width: pct(d.width, W), height: pct(d.height, H), background: d.bg, borderRadius: '3px' });
      return;
    }
    if (d.type === 'corner') {
      apply({ left: '0', top: '0', width: '100%', height: pct(d.height, H), background: d.bg });
      return;
    }
    if (d.type === 'frame') {
      apply({ left: pct(d.x, W), top: pct(d.y, H), width: pct(d.width, W), height: pct(d.height, H), border: '1px solid ' + d.stroke, borderRadius: '10px' });
      return;
    }
    if (d.type === 'orb') {
      apply({
        left: pct(d.cx - d.r, W), top: pct(d.cy - d.r, H),
        width: pct(d.r * 2, W), height: pct(d.r * 2, W),
        borderRadius: '50%',
        background: 'radial-gradient(circle,' + d.bg + '55,transparent 70%)'
      });
      return;
    }
    if (d.type === 'stripes') {
      apply({
        left: '0', top: pct(d.y, H), width: '100%', height: pct(d.height, H),
        background: 'repeating-linear-gradient(0deg,' + d.bg + ' 0 2px,transparent 2px 12px)',
        opacity: '.42'
      });
      return;
    }
    if (d.type === 'split') {
      apply({ left: pct(d.x, W), top: '0', width: pct(d.width, W), height: '100%', background: d.bg, opacity: '.28' });
      return;
    }
    if (d.type === 'quote') {
      // An oversized quote mark, drawn as a glyph in the accent.
      el.textContent = d.text || '\u201C';
      apply({
        left: pct(d.x, W), top: pct(d.y, H),
        width: pct(d.width || W * 0.4, W), height: pct(d.size, W),
        color: d.bg,
        font: '900 ' + (d.size / W * 100).toFixed(3) + 'cqw/0.8 Georgia, serif',
        lineHeight: '0.8',
        opacity: '.9'
      });
      return;
    }
    if (d.type === 'hairline') {
      apply({ left: pct(d.x, W), top: pct(d.y, H), width: pct(d.width, W), height: pct(d.height, H), background: d.bg });
      return;
    }
    if (d.type === 'caption') {
      apply({ left: '0', top: pct(d.y, H), width: '100%', height: pct(d.height, H), background: d.bg });
      return;
    }
    if (d.type === 'stat') {
      // A giant stat number as the hero. It is a decoration, so it never wraps.
      el.textContent = d.text;
      apply({
        left: pct(d.x, W), top: pct(d.y, H),
        width: pct(d.width, W), height: pct(d.height, H),
        color: d.bg,
        font: '900 ' + (d.size / W * 100).toFixed(3) + 'cqw/0.9 Inter, sans-serif',
        letterSpacing: '-.02em',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        whiteSpace: 'nowrap', overflow: 'hidden'
      });
    }
  }

  /* Paints the legibility scrim behind the text area. A dark gradient from the
   * top of the safe zone to the bottom of the card, so a headline stays readable
   * over a busy photo (a source image's own logo block, for example). */
  function paintScrim(el, design) {
    if (!el) return;
    // A treatment with no scrim (split panel, inset frame, blurred backdrop)
    // must CLEAR any scrim a previous template left behind, or the old gradient
    // stays painted over the new card.
    if (!design || !design.scrim) { el.style.background = "none"; el.style.opacity = "0"; return; }
    var s = design.scrim;
    var stops = s.stops.map(function (st) {
      return st.color + ' ' + Math.round(st.offset * 100) + '%';
    }).join(',');
    el.style.background = 'linear-gradient(180deg,' + stops + ')';
    el.style.opacity = '1';
  }

  var api = { paintDecoration: paintDecoration, paintScrim: paintScrim };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CPCardPaint = api;
})(typeof window !== 'undefined' ? window : null);
