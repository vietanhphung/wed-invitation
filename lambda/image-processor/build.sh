#!/bin/sh
# Package the Lambda for nodejs22.x on arm64 (Graviton): sources + production node_modules
# with sharp's linux-arm64 (glibc) binary. Terraform zips the result from build/.
set -eu
cd "$(dirname "$0")"
rm -rf build
mkdir -p build
cp package.json package-lock.json index.mjs lib.mjs build/
cd build
npm ci --omit=dev --no-audit --no-fund --os=linux --cpu=arm64 --libc=glibc >/dev/null
rm -rf node_modules/@img/*linuxmusl*   # Lambda is glibc
test -d node_modules/@img/sharp-linux-arm64 || { echo "sharp linux-arm64 binary missing" >&2; exit 1; }
echo "lambda package ready: $(du -sh . | cut -f1) in lambda/image-processor/build/"
