@echo off

copy README.md build\ristretto\README.md
copy README.md build\p256\README.md

copy LICENSE build\ristretto\LICENSE
copy LICENSE build\p256\LICENSE

copy build\wbg_ristretto\opaque.d.ts build\ristretto\index.d.ts
copy build\wbg_p256\opaque.d.ts build\p256\index.d.ts

echo export const ready: Promise^<void^>; >> "build\ristretto\index.d.ts"
echo export const ready: Promise^<void^>; >> "build\p256\index.d.ts"
