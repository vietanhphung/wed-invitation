#!/bin/sh
# Stamp a fresh ?v=<timestamp> on every page's style.css / config.js / main.js so
# browsers never mix a cached old script with a new config after a deploy.
# Runs automatically before each commit (see tools/install_hooks.sh).
set -e
cd "$(dirname "$0")/.."
v=$(date +%Y%m%d%H%M%S)
for page in traditional/index.html intimate/index.html; do
  sed -i.bak -E "s/(style\.css|config\.js|main\.js)(\?v=[0-9]+)?\"/\1?v=$v\"/g" "$page" && rm -f "$page.bak"
  git add "$page" 2>/dev/null || true
done
echo "stamped assets with ?v=$v"
