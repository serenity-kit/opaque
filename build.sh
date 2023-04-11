#!/usr/bin/env bash
set -e

PKG_NAME="opaque"

# Check if jq is installed
if ! [ -x "$(command -v jq)" ]; then
    echo "jq not installed"
    exit 1
fi

# cleanup existing build
rm -rf ./build

# build
wasm-pack build --target bundler --out-dir build/esm
wasm-pack build --target nodejs --out-dir build/cjs

# cleanup .gitignore
rm build/esm/.gitignore
rm build/cjs/.gitignore

# use the bundler package.json as a base
mv build/esm/package.json build/
rm build/cjs/package.json

# set the package.json main key (affects how nodejs loads this)
cat build/package.json | jq --arg main "cjs/$PKG_NAME.js" '.main = $main'> TMP_FILE && mv TMP_FILE build/package.json

# set the package.json browser key (affects how bundlers load this)
cat build/package.json | jq --arg browser "esm/$PKG_NAME.js" '.browser = $browser'> TMP_FILE && mv TMP_FILE build/package.json

# set the package.json module key (affects how bundlers load this)
cat build/package.json | jq --arg m "esm/$PKG_NAME.js" '.module = $m' > TMP_FILE && mv TMP_FILE build/package.json

# set the package.json types key
cat build/package.json | jq --arg types "esm/$PKG_NAME.d.ts" '.types = $types' > TMP_FILE && mv TMP_FILE build/package.json

# empty the package.json files list
cat build/package.json | jq '.files = []' > TMP_FILE && mv TMP_FILE build/package.json

# add each esm file to the package.json files list
for F in "esm/$PKG_NAME""_bg.wasm" "esm/$PKG_NAME""_bg.d.ts" "esm/$PKG_NAME.js" "esm/$PKG_NAME.d.ts" "esm/$PKG_NAME""_bg.js"
do
  cat build/package.json | jq --arg f "$F" '.files += [$f]' > TMP_FILE && mv TMP_FILE build/package.json
done

# add each cjs file to the package.json files list
for F in "cjs/$PKG_NAME""_bg.wasm" "cjs/$PKG_NAME""_bg.d.ts" "cjs/$PKG_NAME.js" "cjs/$PKG_NAME.d.ts"
do
  cat build/package.json | jq --arg f "$F" '.files += [$f]' > TMP_FILE && mv TMP_FILE build/package.json
done