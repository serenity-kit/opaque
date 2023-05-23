# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Development workflow

Prerequisites:

- pnpm
- rust toolchain
- wasm-pack

To run the wasm-pack build you can run

```sh
pnpm build
```

In case you want to run the examples you need to run to setup the workspaces and use the `build` directory for "@serenity-kit/opaque"

```sh
pnpm install
```

## Tests

To run the tests you can run

```sh
pnpm test
```

## End-to-end tests

To run the end-to-end tests you can run

```sh
cd example-client
pnpm test:e2e
```

## Publish

To publish the packages (opaque and opaque-p256) you can run

```sh
pnpm publish
```
