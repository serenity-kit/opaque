# Opaque

Secure password based client-server authentication without the server ever obtaining knowledge of the password.

A JavaScript implementation of the [OPAQUE protocol](https://datatracker.ietf.org/doc/draft-irtf-cfrg-opaque/) based on [opaque-ke](https://github.com/facebook/opaque-ke).

## Benefits

- Never accidentally log passwords
- Security against pre-computation attacks upon server compromise
- Foundation for encrypted backups and end-to-end encryption apps

**WARNING**: This is a work in progress and not ready for production use.

## Install

```sh
npm install @serenity-kit/opaque
```

## Usage

```ts
import * as opaque from "@serenity-kit/opaque";
```

### Server Setup

The server setup is a one-time operation. It is used to generate the server's long-term private key.

Recommended:

```bash
npx @serenity-kit/opaque create-server-setup
```

The result is a 171 long string. Only store it in a secure location and make sure you have it available in your application e.g. via an environment variable.

```ts
const serverSetup = process.env.OPAQUE_SERVER_SETUP;
```

For development purposes, you can also generate a server setup on the fly:

```ts
const serverSetup = opaque.createServerSetup();
```

Keep in mind that changing the serverSetup will invalidate all existing password files.

### Registration Flow

```ts
// client
const { clientRegistration, registrationRequest } =
  opaque.clientRegistrationStart(password);
```

```ts
// server
const registrationResponse = opaque.serverRegistrationStart({
  serverSetup,
  userIdentifier,
  registrationRequest,
});
```

```ts
// client
const { registrationUpload } = opaque.clientRegistrationFinish({
  clientRegistration,
  registrationResponse,
  password,
});
```

```ts
// server
const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
```

### Login Flow

```ts
// client
const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);
```

```ts
// server
const { serverLogin, credentialResponse } = opaque.serverLoginStart({
  serverSetup,
  userIdentifier,
  passwordFile,
  credentialRequest,
});
```

```ts
// client
const loginResult = opaque.clientLoginFinish({
  clientLogin,
  credentialResponse,
  password,
});
if (!loginResult) {
  throw new Error("Login failed");
}
const { credentialFinalization, sessionKey } = loginResult;
```

```ts
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

### server-with-password-reset

This is the same as the server-simple example but with added password reset endpoints.
Run with:

```
pnpm example:server-with-password-reset:dev
```

### client-simple-webpack

A client-side JS example login/registration form is located in `./examples/client-simple-webpack`.
Expects the examples/server-simple to be running at `localhost:8089` (currently hardcoded).
You can start the client with

```
pnpm example:client-simple-webpack:dev
```

### client-simple-vite

This is the same vanilla JS client example as in `client-simple-webpack` but uses vite instead of webpack.
You can run it with

```
pnpm example:client-simple-vite:dev
```

### fullstack-simple-nextjs

This is the same example app built with nextjs but includes server-side implementation using route handlers. Run with:

```
pnpm example:fullstack-simple-nextjs:dev
```

### client-with-password-reset

This is the same as the client-simple-webpack example but with added password reset functionality.
It expects the server-with-password-reset example to be running.
Run with:

```
pnpm example:client-with-password-reset:dev
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
