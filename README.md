# Opaque

## Development

Prerequisites:

- pnpm
- rust toolchain
- wasm-pack

To run the wasm-pack build you can run

```
pnpm build
```

The project is set up as a workspace with the following packages below.
These packages depend on the built `./build` directory so make sure to run `pnpm build` and `pnpm install` before trying to run them.

### example-server

A server-side nodejs example located in `./example-server`.
You can start the server with

```
pnpm example:server:dev
```

### example-client

A client-side example login/registration form is located in `./example-client`.
Expects the example-server to be running at `localhost:8089` (currently hardcoded).
You can start the client with

```
pnpm example:client:dev
```

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
