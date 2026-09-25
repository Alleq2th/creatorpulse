#!/usr/bin/env bash
# Vendors ffmpeg.wasm into public/vendor/ffmpeg/ so the Studio's export runs
# from our own origin.
#
# Why this exists: the editor loads @ffmpeg/ffmpeg's UMD bundle from unpkg.com.
# That bundle boots its core inside a Web Worker, and a Worker can only be
# constructed from a same-origin URL. unpkg sends no
# `Access-Control-Allow-Origin` header on these files, so the Worker
# constructor rejects the cross-origin script outright and EVERY export fails
# with "Script at ... cannot be accessed from origin". Because the failure
# happens during `await inst.load(...)`, the progress ring never even gets a
# chance to move — the user just sees "Loading the video engine..." until the
# UI gives up. Serving the same files from our own origin removes the cross-
# origin restriction completely.
#
# One-time job. Re-run only to upgrade ffmpeg.wasm.
set -euo pipefail

VER_FFMPEG="0.12.10"
VER_CORE="0.12.6"
VER_UTIL="0.12.1"

DEST="$(cd "$(dirname "$0")/.." && pwd)/public/vendor/ffmpeg"
mkdir -p "$DEST"

fetch(){ curl -fsSL --retry 3 --max-time 60 "$1" -o "$2"; echo "  $(basename "$2")  $(wc -c < "$2") bytes"; }

echo "Vendoring ffmpeg.wasm into public/vendor/ffmpeg/"
fetch "https://unpkg.com/@ffmpeg/ffmpeg@${VER_FFMPEG}/dist/umd/ffmpeg.js"        "$DEST/ffmpeg.js"
# The UMD loader splits its worker bootstrap into a sibling chunk it fetches by
# name at runtime, so this file has to sit next to it.
fetch "https://unpkg.com/@ffmpeg/ffmpeg@${VER_FFMPEG}/dist/umd/814.ffmpeg.js"    "$DEST/814.ffmpeg.js"
fetch "https://unpkg.com/@ffmpeg/util@${VER_UTIL}/dist/umd/index.js"            "$DEST/util.js"
fetch "https://unpkg.com/@ffmpeg/core@${VER_CORE}/dist/umd/ffmpeg-core.js"      "$DEST/ffmpeg-core.js"
fetch "https://unpkg.com/@ffmpeg/core@${VER_CORE}/dist/umd/ffmpeg-core.wasm"    "$DEST/ffmpeg-core.wasm"

echo
echo "Done. These paths must stay publicly readable:"
ls -1 "$DEST"
