# Opaque

**WARNING**: This is a work in progress and not ready for production use.

## Install

```sh
npm install @serenity-kit/opaque
```

test

## Usage

```ts
import * as opaque from "@serenity-kit/opaque";
```

### Registration Flow

```ts
// client
const { clientRegistration, registrationRequest } =
  opaque.clientRegistrationStart(password);

// server
const registrationResponse = opaque.serverRegistrationStart({
  serverSetup,
  clientIdentifier,
  registrationRequest,
});

// client
const { registrationUpload } = opaque.clientRegistrationFinish({
  clientIdentifier,
  clientRegistration,
  registrationResponse,
  password,
});

// server
const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
```

### Login Flow

```ts
// client
const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

// server
const { serverLogin, credentialResponse } = opaque.serverLoginStart({
  serverSetup,
  clientIdentifier,
  passwordFile,
  credentialRequest,
});

// client
const loginResult = opaque.clientLoginFinish({
  clientLogin,
  credentialResponse,
  clientIdentifier,
  password,
});

// server
const sessionKey = opaque.serverLoginFinish({
  serverSetup,
  credentialFinalization,
  serverLogin,
});
```

## Examples

### server-simple

A server-side nodejs example with expressjs located in `./examples/server-simple`.
You can start the server with

```
pnpm example:server:dev
```

### client-simple

A client-side JS example login/registration form is located in `./examples/client-simple`.
Expects the examples/server-simple to be running at `localhost:8089` (currently hardcoded).
You can start the client with

```
pnpm example:client:dev
```

## Advanced usage

The default implementation uses [ristretto255](https://ristretto.group/) for the OPRF and the group mode.

If you would like to use the [P-256](https://docs.rs/p256/latest/p256/) curve instead, you can use the [@serenity-kit/opaque-p256](https://www.npmjs.com/package/@serenity-kit/opaque) package. The API is identical.

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
