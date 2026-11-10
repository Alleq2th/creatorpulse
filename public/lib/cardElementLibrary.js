/* CreatorPulse · Editable card elements.
 * Shared, bounded model for the Elements library, live preview and canvas export.
 */
(function(root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CPCardElementLibrary = api;
})(typeof window !== "undefined" ? window : globalThis, function() {
  "use strict";
  var TYPES = ["text", "badge", "rule", "circle"];
  var COLORS = ["#ffffff", "#111111", "#f2b630", "#2f7bff", "#ff6a1a", "#18c37e", "#ff3fa4", "#9b5cff"];
  var FONTS = {
    impact: "'Anton', Impact, sans-serif",
    archivo_black: "'Archivo Black', Impact, sans-serif",
    anton: "'Anton', Impact, sans-serif",
    bebas_neue: "'Bebas Neue', Impact, sans-serif",
    oswald: "'Oswald', Impact, sans-serif",
    roboto_condensed: "'Roboto Condensed', Arial, sans-serif",
    barlow_condensed: "'Barlow Condensed', Arial, sans-serif",
    montserrat: "'Montserrat', Arial, sans-serif",
    poppins: "'Poppins', Arial, sans-serif",
    inter: "Inter, Arial, sans-serif",
    dm_sans: "'DM Sans', Arial, sans-serif",
    manrope: "'Manrope', Arial, sans-serif",
    space_grotesk: "'Space Grotesk', Arial, sans-serif",
    urbanist: "'Urbanist', Arial, sans-serif",
    outfit: "'Outfit', Arial, sans-serif",
    figtree: "'Figtree', Arial, sans-serif",
    playfair_display: "'Playfair Display', Georgia, serif",
    dm_serif_display: "'DM Serif Display', Georgia, serif",
    lora: "'Lora', Georgia, serif",
    merriweather: "'Merriweather', Georgia, serif",
    cormorant_garamond: "'Cormorant Garamond', Georgia, serif",
    libre_baskerville: "'Libre Baskerville', Georgia, serif",
    roboto_slab: "'Roboto Slab', Georgia, serif",
    ibm_plex_mono: "'IBM Plex Mono', monospace",
    space_mono: "'Space Mono', monospace",
    source_code_pro: "'Source Code Pro', monospace"
  };
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v) || 0)); }
  function hex(v, fallback) { return /^#[0-9a-f]{6}$/i.test(String(v || "")) ? String(v) : fallback; }
  function create(type, index) {
    var id = "element-" + (Number(index) + 1);
    if (type === "badge") return { id:id, type:"badge", text:"NEW", x:.08, y:.78, width:.30, height:.065, color:"#ffffff", background:"#2f7bff", font:"montserrat", fontSize:.022, weight:800, align:"center", opacity:1 };
    if (type === "rule") return { id:id, type:"rule", text:"", x:.08, y:.78, width:.42, height:.008, color:"#f2b630", opacity:1 };
    if (type === "circle") return { id:id, type:"circle", text:"", x:.78, y:.08, width:.12, height:.12, color:"#2f7bff", opacity:.85 };
    return { id:id, type:"text", text:"Add your text", x:.08, y:.76, width:.82, height:.10, color:"#ffffff", font:"impact", fontSize:.038, weight:800, align:"left", opacity:1, italic:false, uppercase:false, rotation:0 };
  }
  function normalize(elements) {
    return (Array.isArray(elements) ? elements : []).slice(0, 24).map(function(e, i) {
      e = e || {};
      var type = TYPES.indexOf(e.type) >= 0 ? e.type : "text";
      var width = clamp(e.width, .02, 1);
      var height = clamp(e.height, .008, 1);
      var x = clamp(e.x, 0, 1 - width);
      var y = clamp(e.y, 0, 1 - height);
      return {
        id: String(e && e.id || "element-" + (i + 1)).slice(0, 64),
        type:type,
        text:String(e && e.text || "").slice(0, 120),
        x:x,
        y:y,
        width:width,
        height:height,
        color:hex(e && e.color, "#ffffff"),
        background:hex(e && e.background, "#2f7bff"),
        font:FONTS[e && e.font] ? e.font : "impact",
        fontSize:clamp(e && e.fontSize, .012, .12),
        weight:[400,500,600,700,800,900].indexOf(Number(e && e.weight)) >= 0 ? Number(e.weight) : 800,
        align:["left","center","right"].indexOf(e && e.align) >= 0 ? e.align : "left",
        opacity:clamp(e && e.opacity == null ? 1 : e.opacity, 0, 1),
        italic:!!(e && e.italic),
        uppercase:!!(e && e.uppercase),
        rotation:clamp(e && e.rotation, -180, 180)
      };
    });
  }
  function renderHTML(elements) {
    return normalize(elements).map(function(e) {
      var left=(e.x*100).toFixed(3)+"%", top=(e.y*100).toFixed(3)+"%", width=(e.width*100).toFixed(3)+"%", height=(e.height*100).toFixed(3)+"%";
      var base="position:absolute;left:"+left+";top:"+top+";width:"+width+";height:"+height+";opacity:"+e.opacity+";transform:rotate("+e.rotation+"deg);transform-origin:center center;box-sizing:border-box;";
      if(e.type==="rule") return '<span class="cp-user-element cp-user-rule" data-user-element="'+escapeHtml(e.id)+'" style="'+base+'background:'+e.color+'"></span>';
      if(e.type==="circle") return '<span class="cp-user-element cp-user-circle" data-user-element="'+escapeHtml(e.id)+'" style="'+base+'background:'+e.color+';border-radius:50%"></span>';
      var label=e.type==="badge" ? "cp-user-badge" : "cp-user-text";
      var bg=e.type==="badge" ? "background:"+e.background+";border-radius:999px;padding:.35em .8em;" : "background:transparent;";
      var size=(e.fontSize*100).toFixed(2)+"cqw";
      var txt=e.uppercase ? e.text.toUpperCase() : e.text;
      return '<span class="cp-user-element '+label+'" data-user-element="'+escapeHtml(e.id)+'" style="'+base+bg+'color:'+e.color+';font-family:'+FONTS[e.font]+';font-size:'+size+';font-weight:'+e.weight+';font-style:'+(e.italic?"italic":"normal")+';text-align:'+e.align+';line-height:1.05;white-space:pre-wrap;overflow:hidden">'+escapeHtml(txt)+'</span>';
    }).join("");
  }
  function escapeHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    var out = [];
    String(text).split("\n").forEach(function (paragraph) {
      var words = paragraph.split(/\s+/).filter(Boolean);
      var line = "";
      words.forEach(function (word) {
        var candidate = line ? line + " " + word : word;
        if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; return; }
        if (line) out.push(line);
        line = "";
        if (ctx.measureText(word).width <= maxWidth) { line = word; return; }
        var part = "";
        Array.from(word).forEach(function (char) {
          if (part && ctx.measureText(part + char).width > maxWidth) { out.push(part); part = char; }
          else part += char;
        });
        line = part;
      });
      if (line) out.push(line);
    });
    return out.slice(0, maxLines || 5);
  }
  function drawCanvas(ctx, elements, W, H) {
    normalize(elements).forEach(function(e) {
      var x=e.x*W, y=e.y*H, w=e.width*W, h=e.height*H;
      ctx.save();
      ctx.globalAlpha=e.opacity;
      ctx.translate(x+w/2,y+h/2);
      ctx.rotate(e.rotation*Math.PI/180);
      if(e.type==="rule") { ctx.fillStyle=e.color; ctx.fillRect(-w/2,-h/2,w,h); }
      else if(e.type==="circle") { ctx.fillStyle=e.color; ctx.beginPath(); ctx.arc(0,0,Math.min(w,h)/2,0,Math.PI*2); ctx.fill(); }
      else {
        if(e.type==="badge") {
          ctx.fillStyle=e.background;
          if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-w/2,-h/2,w,h,h/2); ctx.fill(); }
          else ctx.fillRect(-w/2,-h/2,w,h);
        }
        var txt=e.uppercase?e.text.toUpperCase():e.text;
        var px=e.fontSize*W;
        ctx.font=(e.italic?"italic ":"")+e.weight+" "+px+"px "+FONTS[e.font];
        ctx.fillStyle=e.color;
        ctx.beginPath(); ctx.rect(-w/2,-h/2,w,h); ctx.clip();
        if (e.type === "badge") {
          ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(txt,0,0,w);
        } else {
          ctx.textAlign=e.align; ctx.textBaseline="top";
          var tx=e.align==="left"?-w/2:e.align==="right"?w/2:0;
          var lines=wrapCanvasText(ctx,txt,w,5);
          var lineH=px*1.05;
          lines.forEach(function(line,i){ctx.fillText(line,tx,-h/2+i*lineH);});
        }
      }
      ctx.restore();
    });
  }
  return { TYPES:TYPES, COLORS:COLORS, FONTS:FONTS, create:create, normalize:normalize, renderHTML:renderHTML, drawCanvas:drawCanvas };
});
