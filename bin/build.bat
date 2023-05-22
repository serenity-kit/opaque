@echo off

rmdir /s /q build

wasm-pack build --target bundler --out-dir build\ristretto\esm --features wee_alloc
wasm-pack build --target nodejs --out-dir build\ristretto\cjs --features wee_alloc
wasm-pack build --target bundler --out-dir build\p256\esm --features wee_alloc,p256
wasm-pack build --target nodejs --out-dir build\p256\cjs --features wee_alloc,p256

del build\ristretto\esm\.gitignore
del build\ristretto\cjs\.gitignore
del build\p256\esm\.gitignore
del build\p256\cjs\.gitignore

del build\ristretto\esm\package.json
del build\ristretto\cjs\package.json
del build\p256\esm\package.json
del build\p256\cjs\package.json

copy README.md build\ristretto\README.md
copy README.md build\p256\README.md

copy LICENSE build\ristretto\LICENSE
copy LICENSE build\p256\LICENSE
