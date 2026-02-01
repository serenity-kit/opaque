# Opaque

Secure password based client-server authentication without the server ever obtaining knowledge of the password.

A JavaScript implementation of the [OPAQUE protocol](https://www.rfc-editor.org/rfc/rfc9807.html) based on [opaque-ke](https://github.com/facebook/opaque-ke).

## Benefits

- Never accidentally log passwords
- Security against pre-computation attacks upon server compromise
- Foundation for encrypted backups and end-to-end encryption apps
- Through OTF’s [Red Team Lab](https://www.opentech.fund/labs/red-team-lab/), 7ASecurity conducted a [penetration test and whitebox security review](https://7asecurity.com/reports/pentest-report-opaque.pdf)

## Documentation

In depth documentation can be found at [https://opaque-auth.com/](https://opaque-auth.com/).

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
npx @serenity-kit/opaque@latest create-server-setup
```

The result is a 171 long string. Only store it in a secure location and make sure you have it available in your application e.g. via an environment variable.

```ts
const serverSetup = process.env.OPAQUE_SERVER_SETUP;
```

For development purposes, you can also generate a server setup on the fly:

```ts
const serverSetup = opaque.server.createSetup();
```

Keep in mind that changing the serverSetup will invalidate all existing password files.

### Registration Flow

```ts
// client
const password = "sup-krah.42-UOI"; // user password

const { clientRegistrationState, registrationRequest } =
  opaque.client.startRegistration({ password });
```

```ts
// server
const userIdentifier = "20e14cd8-ab09-4f4b-87a8-06d2e2e9ff68"; // userId/email/username

const { registrationResponse } = opaque.server.createRegistrationResponse({
  serverSetup,
  userIdentifier,
  registrationRequest,
});
```

```ts
// client
const { registrationRecord } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
});

// send registrationRecord to server and create user account
```

### Login Flow

```ts
// client
const password = "sup-krah.42-UOI"; // user password

const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
  password,
});
```

```ts
// server
const userIdentifier = "20e14cd8-ab09-4f4b-87a8-06d2e2e9ff68"; // userId/email/username

const { loginResponse, serverLoginState } = opaque.server.startLogin({
  userIdentifier,
  registrationRecord,
  serverSetup,
  startLoginRequest,
});
```

```ts
// client
const loginResult = opaque.client.finishLogin({
  clientLoginState,
  loginResponse,
  password,
});
if (!loginResult) {
  throw new Error("Login failed");
}
const { finishLoginRequest, sessionKey } = loginResult;
```

```ts
// server
const { sessionKey } = opaque.server.finishLogin({
  finishLoginRequest,
  serverLoginState,
});
```

## Examples

All server examples require configuration through environment variables to set the `OPAQUE_SERVER_SETUP` variable at a minimum.
A `.env` file will be automatically generated in the project root when running `pnpm build` if it doesn't exist already.
You can manually generate it by running `pnpm gen:dotenv`, but by default it will not overwrite an existing file.
To force overwriting an existing `.env` file you can pass the `--force` flag: `pnpm gen:dotenv --force`.

### server-simple

A server-side nodejs example with expressjs located in `./examples/server-simple`.
You can start the server with

```
pnpm example:server:dev
```

By default the server will use a dummy in-memory database.
It will load data from `./data.json` and overwrite the file on change.
You can disable the file persistence by setting the `DISABLE_FS` env variable in the `.env` file:

```
DISABLE_FS=true
```

#### Redis

The server can alternatively use a redis database which can be enabled by setting the `ENABLE_REDIS` variable in the `.env` file:

```
ENABLE_REDIS=true
```

By default it will try to connect to redis on `redis://127.0.0.1:6379`.
You can optionally set the redis url with the `REDIS_URL` variable if you want to use a different redis host/port:

```
REDIS_URL=redis://192.168.0.1:6379
```

You can quickly get a redis server running locally using docker, e.g:

```sh
docker rm -f redis-opaque
docker run --name redis-opaque -p 6379:6379 redis
```

### server-with-password-reset

This is the same as the server-simple example but with added password reset endpoints.
Run with:

```
pnpm example:server-with-password-reset:dev
```

This example also supports the `DISABLE_FS`, `ENABLE_REDIS` and `REDIS_URL` env variables (see `server-simple` example above).

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

This example can also use a redis database through the `ENABLE_REDIS` and `REDIS_URL` env variables (see `server-simple` example above).

### client-with-password-reset

This is the same as the client-simple-webpack example but with added password reset functionality.
It expects the server-with-password-reset example to be running.
Run with:

```
pnpm example:client-with-password-reset:dev
```

## Advanced usage

### Key Stretching

The password input is passed through a key stretching function before being used in the OPRF. The key stretching function is [`argon2id`](https://www.rfc-editor.org/rfc/rfc9106.html). Depending on the application these parameters can be adjusted using param `keyStretching` in the `opaque.client.startRegistration` and `opaque.client.startLogin` functions.

Available options are:

#### Memory constrained (default)

This is the default in case the option is omitted. It is based on the recommendation for memory-constrained environments in the [Argon2 RFC](https://www.rfc-editor.org/rfc/rfc9106.html#section-4-6.2). It was chosen as a default based on this [feedback](https://github.com/cfrg/draft-irtf-cfrg-opaque/issues/467#issuecomment-2489262322).

Parameters:

- Memory: 2^16
- Iterations: 3
- Parallelism: 4

```ts
{
  keyStretching: "memory-constrained";
}
```

**Note**: This configuration is faster, but less secure. `client.finishRegistration` and `client.finishLogin` each take around 1 seconds to complete on a MacBook Pro M1, 2020, 16 GB Memory.

#### RFC Recommended

This option is based on the recommendation in the [Configurations section in the OPAQUE protocol (RFC 9807)](https://www.rfc-editor.org/rfc/rfc9807.html#name-configurations) with the exception that the memory is set to (2^21)-1 instead of (2^21) since we noticed (2^21) caused it to crash when running the registration in a browser environment.

Parameters:

- Memory: 2^21-1
- Iterations: 1
- Parallelism: 4

```ts
{
  keyStretching: "rfc-recommended";
}
```

**Note**: The previous option `"rfc-draft-recommended"` is deprecated but still supported for backwards compatibility.

**Note**: This configuration is the most secure but also the slowest. `client.finishRegistration` and `client.finishLogin` each take around 13 seconds to complete on a MacBook Pro M1, 2020, 16 GB Memory.

#### Custom

You can also provide custom parameters for the key stretching function. The parameters are passed directly to the `argon2id` function. In case you provide an invalid configuration, the function will throw an error.

```ts
const memory = 65536;
const iterations = 3;
const parallelism = 1;
{
  keyStretching: {
    "argon2id-custom": {
      memory,
      iterations,
      parallelism,
    },
  };
}
```

#### Example usage

**Registration**

```ts
// client
opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
});
```

**Login**

```ts
// client
opaque.client.finishLogin({
  clientLoginState,
  loginResponse,
  password,
});
```

### ExportKey

After the initial registration flow as well as ever login flow, the client has access to a private key only available to the client. This is the `exportKey`. The key is not available to the server and it is stable. Meaning if you log in multiple times your `exportKey` will stay the same.

#### Example usage

**Registration**

```ts
// client
const { exportKey, registrationRecord } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
});
```

**Login**

```ts
// client
const loginResult = opaque.client.finishLogin({
  clientLoginState,
  loginResponse,
  password,
});
if (!loginResult) {
  throw new Error("Login failed");
}
const { exportKey, finishLoginRequest, sessionKey } = loginResult;
```

### Server Static Public Key

The result of `opaque.client.finishRegistration` and `opaque.client.finishLogin` also contains a property `serverStaticPublicKey`. It can be used to verify the authenticity of the server.

It's recommended to verify the server static public key in the application layer e.g. hard-code it into the application code and verify it's correctness.

#### Example usage

**Server**

The `serverStaticPublicKey` can be extracted using the following CLI command:

```sh
npx @serenity-kit/opaque@latest get-server-public-key "<server setup string>"
```

Alternatively the functionality is exposed via

```ts
const serverSetupString = opaque.server.createSetup();
opaque.server.getPublicKey(serverSetupString);
```

**Client**

Registration

```ts
// client
const { serverStaticPublicKey } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
});
```

Login

```ts
// client
const loginResult = opaque.client.finishLogin({
  clientLoginState,
  loginResponse,
  password,
});
if (!loginResult) {
  throw new Error("Login failed");
}
const { serverStaticPublicKey } = loginResult;
```

### Identifiers

By default the server-side sets a `userIdentifier` during the registration and login process. This `userIdentifier` does not even need to be exposed to be exposed to a client.

`opaque.client.finishRegistration`, `opaque.server.startLogin` and `opaque.client.finishLogin` all accept an optional object `identifiers`. It accepts an optional string value for the property `client` and an optional string value for `server`.

```ts
type Identifiers = {
  client?: string;
  server?: string;
};
```

The identifiers will be public, but cryptographically bound to the registration record.

Once provided in the `opaque.client.finishRegistration` function call, the identical identifiers must be provided in the `opaque.server.startLogin` and `opaque.client.finishLogin` function call. Otherwise the login will result in an error.

#### Example Registration

```ts
// client
const { registrationRecord } = opaque.client.finishRegistration({
  clientRegistrationState,
  registrationResponse,
  password,
  identifiers: {
    client: "jane@example.com",
    server: "mastodon.example.com",
  },
});

// send registrationRecord to server and create user account
```

#### Example Login

```ts
// server
const { serverLoginState, loginResponse } = opaque.server.startLogin({
  serverSetup,
  userIdentifier,
  registrationRecord,
  startLoginRequest,
  identifiers: {
    client: "jane@example.com",
    server: "mastodon.example.com",
  },
});
```

```ts
// client
const loginResult = opaque.client.finishLogin({
  clientLoginState,
  loginResponse,
  password,
  identifiers: {
    client: "jane@example.com",
    server: "mastodon.example.com",
  },
});
if (!loginResult) {
  throw new Error("Login failed");
}
const { finishLoginRequest, sessionKey } = loginResult;
```

### P256 Support

The default implementation uses [ristretto255](https://ristretto.group/) for the OPRF and the group mode.

If you would like to use the [P-256](https://docs.rs/p256/latest/p256/) curve instead, you can use the [@serenity-kit/opaque-p256](https://www.npmjs.com/package/@serenity-kit/opaque) package. The API is identical.

### ReactNative

There is also a React Native version of this library available at [https://github.com/serenity-kit/react-native-opaque](https://github.com/serenity-kit/react-native-opaque) as weel as [https://github.com/serenity-kit/react-native-opaque-p256](https://github.com/serenity-kit/react-native-opaque-p256).

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
