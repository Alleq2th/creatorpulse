#!/usr/bin/env bash
# Proves the new tests actually catch a regression.
# For each break: apply it, confirm the file really changed, run the suite,
# require a FAILURE, then restore and require green again.
set -u
cd "$(dirname "$0")/.."
PASS=0; FAIL=0

run_break () {
  local name="$1" file="$2" from="$3" to="$4"
  cp "$file" /tmp/break.bak
  python3 - "$file" "$from" "$to" <<'PY'
import sys
p, a, b = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
if a not in s:
    print("BREAK-NOT-APPLIED"); sys.exit(3)
open(p, "w").write(s.replace(a, b, 1))
PY
  if [ $? -ne 0 ]; then echo "⚠️  $name: break did not apply"; cp /tmp/break.bak "$file"; FAIL=$((FAIL+1)); return; fi
  if ! diff -q /tmp/break.bak "$file" >/dev/null; then
    local out; out=$(node --test test/cardPreviewExport.test.js 2>&1 | grep -E "^# fail")
    if echo "$out" | grep -qE "^# fail [1-9]"; then
      echo "✅ $name: test caught it ($out)"
      PASS=$((PASS+1))
    else
      echo "❌ $name: tests still passed — the test does not catch this"
      FAIL=$((FAIL+1))
    fi
  else
    echo "⚠️  $name: file unchanged"; FAIL=$((FAIL+1))
  fi
  cp /tmp/break.bak "$file"
}

run_break "blob: badge sized from the container" public/lib/cardPaint.js \
  "maxWidth: pct(d.width, W)" "maxWidth: '100%'"

run_break "tiktok: card shrinks to content" public/index.html \
  "  .mock-tt-shell > .cc-live-stage,
  .mock-tt-shell > .cp-canvas-stage {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;" "  .mock-tt-shell > .cc-live-stage,
  .mock-tt-shell > .cp-canvas-stage {
    position: relative;
    width: 100%;
    height: auto;"

run_break "safe zone: width not clamped" public/lib/cardLayout.js \
  "var width = clamp(box.width, 0.05, maxW);" "var width = box.width;"

run_break "export: hardcoded line height" public/core.js \
  "const lineH = px * (Number(l.lineHeight) || 1.1);" "const lineH = px * 1.05;"

run_break "export: empty slots drawn" public/core.js \
  "if (!l || !l.text || l.empty) return;" "if (!l || !l.text) return;"

run_break "download: font throws again" public/core.js \
  "if (!ok) console.warn(\"[card export] font fell back to a system face:\", key);" "if (!ok) throw new Error('Selected font did not load');"

run_break "preview: dashed outline visible" public/index.html \
  ".cc-live-stage .cp-canvas-block{border:0;background:transparent;cursor:default}" \
  ".cc-live-stage .cp-canvas-block{border:1px dashed rgba(255,255,255,.84);background:transparent;cursor:default}"

run_break "scrim: removed from the export" public/core.js \
  "cpDrawScrim(ctx, design, W, H);" ""

run_break "theme tiles: truncate again" public/lib/themePreview.js \
  "L.layerCss(l) + '\">'" "L.layerCss(l) + ';text-overflow:ellipsis\">'"

echo "---"
echo "caught: $PASS   missed: $FAIL"
node --test test/cardPreviewExport.test.js 2>&1 | grep -E "^# (tests|pass|fail)"
