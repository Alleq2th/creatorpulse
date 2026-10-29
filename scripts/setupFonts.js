// Installs our bundled font files (assets/fonts/*.ttf) into a directory
// fontconfig scans by default, so sharp (via librsvg) can resolve
// font-family="Space Grotesk" / "Inter" in the stat card SVGs.
//
// Why this exists: the stat cards used font-family="serif"/"sans-serif"
// which only ever resolves to whatever generic fonts happen to be
// preinstalled on the host — fine for something like DejaVu, but there's no
// way to get a *specific* brand font (Space Grotesk, Inter) onto the page
// without shipping the font file and registering it with fontconfig
// ourselves. That's what this does.
//
// Runs at build time (npm postinstall) and defensively again at server boot,
// since it's cheap and idempotent.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

function installFonts() {
  const srcDir = path.join(__dirname, "..", "assets", "fonts");
  if (!fs.existsSync(srcDir)) return;

  // XDG default fontconfig dir — writable without root, picked up by the
  // standard fontconfig <dir prefix="xdg">fonts</dir> entry on Debian-based
  // hosts (which is what Render's Node runtime uses).
  const destDir = path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
    "fonts"
  );

  try {
    fs.mkdirSync(destDir, { recursive: true });
    const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith(".ttf") || f.toLowerCase().endsWith(".otf"));
    for (const f of files) {
      const dest = path.join(destDir, f);
      if (!fs.existsSync(dest)) fs.copyFileSync(path.join(srcDir, f), dest);
    }
    // Best-effort — if fc-cache isn't on the image, fontconfig still finds
    // fonts by scanning the dir directly (no cache), just marginally slower
    // on the very first render.
    try { execSync("fc-cache -f", { stdio: "ignore" }); } catch (e) {}
    console.log(`[fonts] installed ${files.length} font file(s) to ${destDir}`);
  } catch (e) {
    console.log(`[fonts] setup skipped: ${e.message}`);
  }
}

// Serverless runtimes (Vercel) run the app from a read-only bundle and do not
// scan ~/.local/share/fonts, so the copy above never reaches the renderer and
// every letter in the stat cards comes out as an empty box. This writes a
// fontconfig file that points straight at the fonts shipped in assets/fonts
// and makes it the one sharp/librsvg reads. Safe to call more than once.
function configureFontconfig() {
  const srcDir = path.join(__dirname, "..", "assets", "fonts");
  if (!fs.existsSync(srcDir)) return null;
  const tmp = os.tmpdir();
  const confDir = path.join(tmp, "creatorpulse-fontconfig");
  const confFile = path.join(confDir, "fonts.conf");
  const cacheDir = path.join(tmp, "creatorpulse-fontcache");
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${esc(srcDir)}</dir>
  <cachedir>${esc(cacheDir)}</cachedir>
  <alias><family>sans-serif</family><prefer><family>Inter</family></prefer></alias>
  <alias><family>Impact</family><prefer><family>Anton</family></prefer></alias>
  <alias><family>Archivo Black</family><prefer><family>Anton</family></prefer></alias>
</fontconfig>
`;
  fs.mkdirSync(confDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(confFile, xml);
  process.env.FONTCONFIG_FILE = confFile;
  return confFile;
}

module.exports = { installFonts, configureFontconfig };

if (require.main === module) installFonts();

