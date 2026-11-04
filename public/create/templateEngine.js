// CreatorPulse production template configuration and composition engine.
// Each template describes platform, canvas, palette, typography, layout and
// decorations. The public DOM renderer and canvas exporter consume this same
// configuration, so preview and download use the same design state.
(function (root) {
  'use strict';

  const TEMPLATES = {
    // TikTok: one complete 1080x1920 composition per generation.
    viral_hook: {
      id: 'viral_hook', platform: 'tiktok', name: '9:16 Viral Hook', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#05070a', text: '#ffffff', accent: '#22d3ee', secondary: '#94a3b8', dim: 0.45, gradient: 'linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.92))' },
      typography: { headline: { family: 'impact', weight: 900, size: 6.8, lineHeight: 1.05, transform: 'uppercase' }, supportingText: { family: 'modern_sans', weight: 600, size: 3.4, lineHeight: 1.35 }, ctaLine: { family: 'condensed_sans', weight: 800, size: 2.8 } },
      layout: { headline: { x: .08, y: .30, width: .84, height: .24 }, supportingText: { x: .10, y: .56, width: .80, height: .18 }, ctaLine: { x: .12, y: .86, width: .76, height: .06 } },
      decoration: { type: 'badge', text: 'VIRAL HOOK', accent: '#22d3ee' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'bottomGradient' },
      safeZones: { top: .12, bottom: .12, left: .06, right: .06 }
    },
    silent_camera: {
      id: 'silent_camera', platform: 'tiktok', name: 'Silent Camera', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#090a0d', text: '#ffffff', accent: '#f43f5e', secondary: '#e4e4e7', dim: .18, gradient: 'linear-gradient(180deg,rgba(0,0,0,.68),transparent 35%,rgba(0,0,0,.1) 65%,rgba(0,0,0,.8))' },
      typography: { headline: { family: 'editorial_serif', weight: 700, size: 5.2, lineHeight: 1.15 }, supportingText: { family: 'modern_sans', weight: 500, size: 3.2, lineHeight: 1.4 }, ctaLine: { family: 'modern_sans', weight: 700, size: 2.6 } },
      layout: { headline: { x: .08, y: .12, width: .84, height: .18 }, supportingText: { x: .08, y: .68, width: .84, height: .18 }, ctaLine: { x: .12, y: .88, width: .76, height: .05 } },
      decoration: { type: 'corner', accent: '#f43f5e' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'subject', overlay: 'subtleGradient' },
      safeZones: { top: .10, bottom: .12, left: .06, right: .06 }
    },
    quote_punch: {
      id: 'quote_punch', platform: 'tiktok', name: 'Bold Statement', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#0a0a0c', text: '#ffffff', accent: '#fbbf24', secondary: '#d1d5db', dim: .48, gradient: 'linear-gradient(135deg,rgba(15,15,18,.82),rgba(5,5,8,.94))' },
      typography: { headline: { family: 'impact', weight: 900, size: 7.2, lineHeight: 1.0, transform: 'uppercase' }, supportingText: { family: 'condensed_sans', weight: 600, size: 3.4, lineHeight: 1.35 }, ctaLine: { family: 'condensed_sans', weight: 800, size: 2.8 } },
      layout: { headline: { x: .06, y: .20, width: .88, height: .34 }, supportingText: { x: .08, y: .58, width: .84, height: .20 }, ctaLine: { x: .08, y: .84, width: .84, height: .06 } },
      decoration: { type: 'rule', accent: '#fbbf24' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'dark' },
      safeZones: { top: .12, bottom: .12, left: .05, right: .05 }
    },
    minimal_noir: {
      id: 'minimal_noir', platform: 'tiktok', name: 'Dark Minimalist', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#050505', text: '#f4f4f5', accent: '#a1a1aa', secondary: '#a1a1aa', dim: .38, gradient: 'linear-gradient(180deg,rgba(5,5,5,.72),rgba(5,5,5,.9))' },
      typography: { headline: { family: 'modern_sans', weight: 700, size: 5.4, lineHeight: 1.2 }, supportingText: { family: 'modern_sans', weight: 400, size: 3.0, lineHeight: 1.45 }, ctaLine: { family: 'modern_sans', weight: 600, size: 2.4 } },
      layout: { headline: { x: .10, y: .36, width: .80, height: .22 }, supportingText: { x: .12, y: .62, width: .76, height: .16 }, ctaLine: { x: .15, y: .86, width: .70, height: .05 } },
      decoration: { type: 'none', accent: '#a1a1aa' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'soft' },
      safeZones: { top: .10, bottom: .10, left: .08, right: .08 }
    },
    high_retention: {
      id: 'high_retention', platform: 'tiktok', name: 'High-Retention Alert', aspect: 'tiktok',
      canvas: { width: 1080, height: 1920 },
      palette: { bg: '#0c0a1a', text: '#ffffff', accent: '#c084fc', secondary: '#e9d5ff', dim: .48, gradient: 'linear-gradient(180deg,rgba(12,10,26,.62),rgba(12,10,26,.94))' },
      typography: { headline: { family: 'impact', weight: 900, size: 6.4, lineHeight: 1.05, transform: 'uppercase' }, supportingText: { family: 'condensed_sans', weight: 700, size: 3.6, lineHeight: 1.3 }, ctaLine: { family: 'condensed_sans', weight: 900, size: 2.8 } },
      layout: { headline: { x: .08, y: .18, width: .84, height: .24 }, supportingText: { x: .08, y: .46, width: .84, height: .28 }, ctaLine: { x: .10, y: .82, width: .80, height: .06 } },
      decoration: { type: 'badge', text: 'MUST WATCH', accent: '#a855f7' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'dark' },
      safeZones: { top: .12, bottom: .12, left: .06, right: .06 }
    },

    // Instagram: both single image and carousel use 1080x1350 slides.
    impact: {
      id: 'impact', platform: 'instagram', name: 'Bold Impact', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#101114', text: '#ffffff', accent: '#f43f5e', secondary: '#d4d4d8', dim: .42, gradient: 'linear-gradient(180deg,rgba(0,0,0,.35),rgba(16,17,20,.88))' },
      typography: { headline: { family: 'impact', weight: 900, size: 6.4, lineHeight: 1.05, transform: 'uppercase' }, supportingText: { family: 'modern_sans', weight: 600, size: 3.2, lineHeight: 1.3 }, ctaLine: { family: 'condensed_sans', weight: 800, size: 2.8 } },
      layout: { headline: { x: .08, y: .20, width: .84, height: .28 }, supportingText: { x: .08, y: .52, width: .84, height: .22 }, ctaLine: { x: .08, y: .86, width: .84, height: .06 } },
      slideLayouts: {
        cover: { headline: { x: .08, y: .18, width: .84, height: .30 }, supportingText: { x: .08, y: .52, width: .84, height: .22 } },
        body: { headline: { x: .08, y: .12, width: .84, height: .22 }, supportingText: { x: .08, y: .38, width: .84, height: .36 } },
        closing: { headline: { x: .08, y: .24, width: .84, height: .24 }, supportingText: { x: .08, y: .52, width: .84, height: .22 }, ctaLine: { x: .08, y: .82, width: .84, height: .08 } }
      },
      decoration: { type: 'rule', accent: '#f43f5e' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'bottomGradient' },
      safeZones: { top: .07, bottom: .07, left: .07, right: .07 }
    },
    editorial: {
      id: 'editorial', platform: 'instagram', name: 'Editorial Clean', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#09090b', text: '#fafafa', accent: '#e4e4e7', secondary: '#a1a1aa', dim: .34, gradient: 'linear-gradient(180deg,rgba(9,9,11,.5),rgba(9,9,11,.86))' },
      typography: { headline: { family: 'editorial_serif', weight: 700, size: 5.6, lineHeight: 1.15 }, supportingText: { family: 'classic_serif', weight: 400, size: 3.2, lineHeight: 1.45 }, ctaLine: { family: 'modern_sans', weight: 600, size: 2.4 } },
      layout: { headline: { x: .10, y: .52, width: .80, height: .20 }, supportingText: { x: .10, y: .74, width: .80, height: .14 }, ctaLine: { x: .10, y: .90, width: .80, height: .04 } },
      slideLayouts: {
        cover: { headline: { x: .10, y: .52, width: .80, height: .20 }, supportingText: { x: .10, y: .74, width: .80, height: .14 } },
        body: { headline: { x: .10, y: .52, width: .80, height: .20 }, supportingText: { x: .10, y: .74, width: .80, height: .14 } },
        closing: { headline: { x: .10, y: .52, width: .80, height: .18 }, supportingText: { x: .10, y: .72, width: .80, height: .13 }, ctaLine: { x: .10, y: .88, width: .80, height: .05 } }
      },
      decoration: { type: 'frame', accent: 'rgba(255,255,255,.22)' },
      image: { mode: 'panel', crop: 'cover', focal: 'center', overlay: 'subtle' },
      safeZones: { top: .08, bottom: .08, left: .10, right: .10 }
    },
    stat_split: {
      id: 'stat_split', platform: 'instagram', name: 'Data & Stat Split', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#111418', text: '#ffffff', accent: '#38bdf8', secondary: '#bae6fd', dim: .38, gradient: 'linear-gradient(180deg,rgba(17,20,24,.62),rgba(10,12,15,.94))' },
      typography: { headline: { family: 'impact', weight: 900, size: 6.2, lineHeight: 1.05, transform: 'uppercase' }, supportingText: { family: 'condensed_sans', weight: 600, size: 3.4, lineHeight: 1.35 }, ctaLine: { family: 'condensed_sans', weight: 800, size: 2.8 } },
      layout: { headline: { x: .08, y: .18, width: .40, height: .30 }, supportingText: { x: .08, y: .51, width: .38, height: .25 }, ctaLine: { x: .08, y: .84, width: .38, height: .06 } },
      slideLayouts: { cover: { headline: { x: .08, y: .18, width: .40, height: .30 }, supportingText: { x: .08, y: .51, width: .38, height: .25 } }, body: { headline: { x: .08, y: .15, width: .40, height: .28 }, supportingText: { x: .08, y: .47, width: .38, height: .30 } }, closing: { headline: { x: .08, y: .20, width: .40, height: .28 }, supportingText: { x: .08, y: .50, width: .38, height: .22 }, ctaLine: { x: .08, y: .82, width: .38, height: .07 } } },
      decoration: { type: 'split', accent: '#38bdf8' },
      image: { mode: 'split', crop: 'cover', focal: 'center', overlay: 'panel' },
      safeZones: { top: .07, bottom: .07, left: .08, right: .08 }
    },
    dark_gradient: {
      id: 'dark_gradient', platform: 'instagram', name: 'Dark Ambient Glow', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#080712', text: '#f5f3ff', accent: '#818cf8', secondary: '#c7d2fe', dim: .42, gradient: 'radial-gradient(circle at 50% 30%,rgba(99,102,241,.32),rgba(8,7,18,.9) 72%,#05040c)' },
      typography: { headline: { family: 'impact', weight: 900, size: 6, lineHeight: 1.08, transform: 'uppercase' }, supportingText: { family: 'modern_sans', weight: 500, size: 3.2, lineHeight: 1.35 }, ctaLine: { family: 'condensed_sans', weight: 800, size: 2.6 } },
      layout: { headline: { x: .08, y: .22, width: .84, height: .26 }, supportingText: { x: .08, y: .52, width: .84, height: .24 }, ctaLine: { x: .12, y: .86, width: .76, height: .06 } },
      slideLayouts: { cover: { headline: { x: .08, y: .19, width: .84, height: .27 }, supportingText: { x: .08, y: .50, width: .84, height: .23 } }, body: { headline: { x: .08, y: .12, width: .84, height: .24 }, supportingText: { x: .08, y: .40, width: .84, height: .34 } }, closing: { headline: { x: .08, y: .22, width: .84, height: .24 }, supportingText: { x: .08, y: .51, width: .84, height: .22 }, ctaLine: { x: .12, y: .84, width: .76, height: .06 } } },
      decoration: { type: 'orb', accent: '#818cf8' },
      image: { mode: 'fullBleed', crop: 'cover', focal: 'center', overlay: 'radial' },
      safeZones: { top: .07, bottom: .07, left: .07, right: .07 }
    },
    neon_noir: {
      id: 'neon_noir', platform: 'instagram', name: 'Neon Cyber', aspect: '4/5',
      canvas: { width: 1080, height: 1350 },
      palette: { bg: '#021a14', text: '#ecfdf5', accent: '#4ade80', secondary: '#6ee7b7', dim: .42, gradient: 'linear-gradient(135deg,rgba(2,26,20,.78),rgba(1,15,11,.94))' },
      typography: { headline: { family: 'code_mono', weight: 800, size: 5.8, lineHeight: 1.10, transform: 'uppercase' }, supportingText: { family: 'code_mono', weight: 500, size: 3.0, lineHeight: 1.35 }, ctaLine: { family: 'code_mono', weight: 800, size: 2.6 } },
      layout: { headline: { x: .08, y: .16, width: .84, height: .26 }, supportingText: { x: .08, y: .46, width: .84, height: .30 }, ctaLine: { x: .08, y: .84, width: .84, height: .06 } },
      slideLayouts: { cover: { headline: { x: .08, y: .15, width: .84, height: .26 }, supportingText: { x: .08, y: .46, width: .84, height: .26 } }, body: { headline: { x: .08, y: .11, width: .84, height: .24 }, supportingText: { x: .08, y: .40, width: .84, height: .36 } }, closing: { headline: { x: .08, y: .20, width: .84, height: .26 }, supportingText: { x: .08, y: .49, width: .84, height: .24 }, ctaLine: { x: .08, y: .82, width: .84, height: .06 } } },
      decoration: { type: 'stripes', accent: '#4ade80' },
      image: { mode: 'panel', crop: 'cover', focal: 'center', overlay: 'tint' },
      safeZones: { top: .07, bottom: .07, left: .07, right: .07 }
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  function get(id) { return TEMPLATES[id] || null; }
  function list(platform) { return Object.values(TEMPLATES).filter(t => !platform || t.platform === platform); }
  function normalizeContent(slide) {
    const s = slide || {};
    const text = (v) => typeof v === 'string' ? v.trim() : '';
    return {
      headline: text(s.headline || s.hookHeadline || s.title),
      supportingText: text(s.supportingText || s.body || s.reaction || s.stat || s.sectionLabel),
      ctaLine: text(s.ctaLine),
      tag: text(s.tag || s.sectionLabel || s.sourceLabel),
      stat: text(s.stat),
      sourceLabel: text(s.sourceLabel)
    };
  }
  function roleFor(slide, index, total) {
    const s = slide || {};
    if (s.type === 'hook' || s.useCover || index === 0) return 'cover';
    if (s.type === 'outro' || /follow|save|share/i.test(s.ctaLine || '') && index === total - 1) return 'closing';
    return 'body';
  }
  function layoutFor(templateId, slide, index, total) {
    const t = get(templateId);
    if (!t) return null;
    const role = roleFor(slide, index || 0, total || 1);
    const roleLayout = t.slideLayouts && t.slideLayouts[role];
    return clone(roleLayout || t.layout);
  }
  function apply(slide, templateId, index, total) {
    if (!slide) return slide;
    const t = get(templateId) || (slide.silentCamera ? TEMPLATES.silent_camera : TEMPLATES.impact);
    const existing = slide.textLayout || {};
    const layout = layoutFor(t.id, slide, index || 0, total || 1) || t.layout;
    // Keep user-adjusted boxes once they've been edited; template config is the
    // initial composition only, so changing a template never discards user work.
    slide.textLayout = Object.assign({}, layout, existing);
    slide._style = Object.assign({}, slide._style || {}, {
      templateId: t.id,
      typography: t.typography.headline.family,
      textColor: t.palette.text,
      dim: t.palette.dim,
      layerColors: Object.assign({}, slide._style && slide._style.layerColors || {}, { ctaLine: t.palette.accent }),
      templatePalette: clone(t.palette),
      templateTypography: clone(t.typography),
      templateDecoration: clone(t.decoration),
      imageTreatment: clone(t.image)
    });
    slide._templateId = t.id;
    return slide;
  }
  function resolve(templateId, platform) {
    const t = get(templateId);
    if (t && (!platform || t.platform === platform)) return t;
    return platform === 'tiktok' ? TEMPLATES.viral_hook : TEMPLATES.impact;
  }
  const api = { TEMPLATES, get, list, normalizeContent, roleFor, layoutFor, apply, resolve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CPTemplateEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
