#!/bin/bash

set -e

rm -rf build

wasm-pack build --target bundler --out-dir build/ristretto/esm --features wee_alloc
wasm-pack build --target nodejs --out-dir build/ristretto/cjs --features wee_alloc
wasm-pack build --target bundler --out-dir build/p256/esm --features wee_alloc,p256
wasm-pack build --target nodejs --out-dir build/p256/cjs --features wee_alloc,p256

rm build/ristretto/esm/.gitignore
rm build/ristretto/cjs/.gitignore
rm build/p256/esm/.gitignore
rm build/p256/cjs/.gitignore

rm build/ristretto/esm/package.json
rm build/ristretto/cjs/package.json
rm build/p256/esm/package.json
rm build/p256/cjs/package.json

cp README.md build/ristretto/README.md
cp README.md build/p256/README.md

cp LICENSE build/ristretto/LICENSE
cp LICENSE build/p256/LICENSE
