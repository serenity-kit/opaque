# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Opaque is a JavaScript implementation of the OPAQUE protocol for secure password-based client-server authentication. The server never obtains knowledge of the password. Built with Rust (core cryptographic implementation) compiled to WebAssembly, with TypeScript wrappers.

## Build Commands

```bash
pnpm install                    # Install dependencies
pnpm build                      # Build WASM + JS bundles (outputs to build/ristretto and build/p256)
pnpm test                       # Run all tests (p256 + ristretto variants)
pnpm test:ristretto             # Test default Ristretto255 variant only
pnpm test:p256                  # Test P-256 variant only
pnpm typecheck                  # Type check all TypeScript
pnpm format                     # Fix prettier formatting issues
```

**After every code change, run `pnpm format` to fix formatting issues, then run `pnpm test` to verify changes.**

## Prerequisites

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli
```

## Architecture

- **src/lib.rs**: Core Rust implementation using opaque-ke crate, compiled to WASM
- **bin/build.js**: Build orchestration (Rust → WASM → wasm-bindgen → Rollup bundle)
- **bin/templates/**: TypeScript wrappers (index.ts, client.ts, server.ts) copied into builds
- **build/ristretto/**: Default build output (Ristretto255 curve)
- **build/p256/**: Alternative build output (P-256 curve, enabled via Cargo feature flag)
- **tests/**: Vitest tests run against both curve implementations
- **examples/**: Integration examples (Express servers, Webpack/Vite clients, Next.js fullstack)

## Key Implementation Details

- Two cipher suite variants: Ristretto255 (default) and P-256 (feature flag)
- WASM is inlined into JS bundles (no separate .wasm files)
- Must await `opaque.ready` before using any functions
- All protocol messages are base64-encoded for transmission
- Argon2id key stretching with configurable parameters

## Running Examples

```bash
pnpm gen:dotenv                              # Generate .env with OPAQUE_SERVER_SETUP
pnpm example:server:dev                      # Express server on :8089
pnpm example:client-simple-webpack:dev       # Webpack client on :8080
pnpm example:fullstack-simple-nextjs:dev     # Next.js fullstack
```

## Versioning

Changes require a changeset: `npx changeset`
