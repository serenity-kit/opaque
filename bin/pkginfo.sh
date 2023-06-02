#!/bin/bash

set -e

cp README.md build/ristretto/README.md
cp README.md build/p256/README.md

cp LICENSE build/ristretto/LICENSE
cp LICENSE build/p256/LICENSE

cp build/wbg_ristretto/opaque.d.ts build/ristretto/index.d.ts
cp build/wbg_p256/opaque.d.ts build/p256/index.d.ts

echo 'export const ready: Promise<void>;' >> build/ristretto/index.d.ts
echo 'export const ready: Promise<void>;' >> build/p256/index.d.ts
