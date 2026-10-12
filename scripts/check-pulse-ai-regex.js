// Standalone proof: load the REAL pulseAiParseContentCards out of a public JS
// file and call it with a real CARD payload. Throws on the broken code, works
// on the fixed code.
const fs = require("fs");

const file = process.argv[2] || "public/app.js";
const src = fs.readFileSync(file, "utf8");
const escFn = src.slice(src.indexOf("function esc("), src.indexOf("\n", src.indexOf("function esc(")));
const start = src.indexOf("function pulseAiParseContentCards");
const end = src.indexOf("\nfunction pulseAiParseTablesToCards");

const payload =
  "CARD 01 \u2014 THE DILEMMA\n" +
  "Title: Boots vs. Beach\n" +
  'Hook: "seed hook"\n' +
  "Creative angle: pit grit against sunshine\n" +
  "Why this angle works: controversy\n" +
  "Call to action: Which one?\n" +
  "\nCARD 02 \u2014 THE UNPOPULAR OPINION\n" +
  "Title: Second Card\n" +
  'Hook: "second hook"\n' +
  "Creative angle: counter-intuitive\n";

try {
  const factory = new Function(escFn + "\n" + src.slice(start, end) + "\nreturn pulseAiParseContentCards;");
  const fn = factory();
  const out = fn(payload);
  const cards = out ? out.cardsHtml.split("pa-content-card").length - 1 : 0;
  console.log(`RESULT: OK  (cards parsed: ${cards})`);
} catch (e) {
  console.log(`RESULT: THREW -> ${String(e).split("\n")[0]}`);
}
