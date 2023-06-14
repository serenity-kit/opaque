# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Development workflow

Prerequisites:

- pnpm
- rust toolchain
- rust target `wasm32-unknown-unknown`
- wasm-bindgen

You can install wasm-bindgen with:

```sh
cargo install wasm-bindgen-cli
```

The `wasm32-unknown-unknown` target can be installed with:

```sh
rustup target add wasm32-unknown-unknown
```

To run the build you can run

```sh
pnpm install
pnpm build
```

## Tests

To run the tests you can run

```sh
pnpm test
```

## End-to-end tests

To run the end-to-end tests you can run

```sh
cd examples/client-simple-webpack
pnpm test:e2e
```

## Publish

To publish the packages (opaque and opaque-p256) you can run

```sh
pnpm publish:all
```
