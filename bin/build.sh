#!/bin/bash

set -e

rm -rf build

cargo build --target=wasm32-unknown-unknown --release --features wee_alloc
wasm-bindgen --out-dir=build/wbg_ristretto --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm

cargo build --target=wasm32-unknown-unknown --release --features wee_alloc,p256
wasm-bindgen --out-dir=build/wbg_p256 --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm
