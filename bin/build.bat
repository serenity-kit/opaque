@echo off

rmdir /s /q build

wasm-pack build --target bundler --out-dir build\esm --features wee_alloc
wasm-pack build --target nodejs --out-dir build\cjs --features wee_alloc

del build\esm\.gitignore
del build\cjs\.gitignore

del build\esm\package.json
del build\cjs\package.json

copy README.md build\README.md
copy LICENSE build\LICENSE
