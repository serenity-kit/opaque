# Opaque

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
