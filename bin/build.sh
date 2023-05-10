#!/bin/bash

set -e

rm -rf build

wasm-pack build --target bundler --out-dir build/esm
wasm-pack build --target nodejs --out-dir build/cjs

rm build/esm/.gitignore
rm build/cjs/.gitignore

rm build/esm/package.json
rm build/cjs/package.json

cp README.md build/README.md
cp LICENSE build/LICENSE
