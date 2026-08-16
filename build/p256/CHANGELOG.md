# @serenity-kit/opaque-p256

## 1.1.0

### Minor Changes

- [#171](https://github.com/serenity-kit/opaque/pull/171) [`42e6a2c`](https://github.com/serenity-kit/opaque/commit/42e6a2cd8bd1023619af9f1f9cef2ee29c49432d) Thanks [@nikgraf](https://github.com/nikgraf)! - Add `rfc-recommended` keyStretching option to reference the finalized RFC 9807. The previous `rfc-draft-recommended` option is deprecated but remains supported for backwards compatibility.

### Patch Changes

- [#165](https://github.com/serenity-kit/opaque/pull/165) [`a0020eb`](https://github.com/serenity-kit/opaque/commit/a0020ebb866c510b510868c75c8a681e602fd7dd) Thanks [@gustavovalverde](https://github.com/gustavovalverde)! - Fix wasm-bindgen deprecation warning by updating to version 0.2.106 and using the new initialization API format.

## 1.0.0

### Major Changes

- [#156](https://github.com/serenity-kit/opaque/pull/156) [`9914d9e`](https://github.com/serenity-kit/opaque/commit/9914d9e60c9c1e95a8980e0c3159da1e92dde062) Thanks [@nikgraf](https://github.com/nikgraf)! - Upgrade opaque-ke to 4.0.0 matching RFC9807

  This includes breaking changes if you use a previous version of the library and created a server setup and registration records with it. You can write a Rust script to convert the server setup and registration records to the new format. See [https://github.com/facebook/opaque-ke/blob/main/CHANGELOG.md#400-october-23-2025](https://github.com/facebook/opaque-ke/blob/main/CHANGELOG.md#400-october-23-2025) for more details.

## 0.9.0

### Minor Changes

- [#127](https://github.com/serenity-kit/opaque/pull/127) [`31b6121`](https://github.com/serenity-kit/opaque/commit/31b6121081b94426b52d348960c89ea57bcd9298) Thanks [@nikgraf](https://github.com/nikgraf)! - Introducing the options "keyStretching" and changing the default keyStretching parameters resulting in a breaking change

- [#123](https://github.com/serenity-kit/opaque/pull/123) [`0083cdd`](https://github.com/serenity-kit/opaque/commit/0083cdd7eec0cc6a456002b43bc2ae569b175892) Thanks [@nikgraf](https://github.com/nikgraf)! - Upgraded opaque-ke which introduced a breaking change due changing the protocol context string

## 0.8.4

### Patch Changes

- [#110](https://github.com/serenity-kit/opaque/pull/110) [`6db1df6`](https://github.com/serenity-kit/opaque/commit/6db1df61197c40a0a35b4482072de35e2f112b42) Thanks [@nikgraf](https://github.com/nikgraf)! - Fix npx scripts create-server-setup & get-server-public-key

## 0.8.3

### Patch Changes

- [`6f1571a`](https://github.com/serenity-kit/opaque/commit/6f1571a5bd3c86be7807347e942f20d4804c1231) Thanks [@nikgraf](https://github.com/nikgraf)! - Publish using provenance

## 0.8.2

### Patch Changes

- [`00515f3`](https://github.com/serenity-kit/opaque/commit/00515f3764e90a206affabfbc08f775ba89fbab8) Thanks [@nikgraf](https://github.com/nikgraf)! - Publishing via the CI

## 0.8.1

### Patch Changes

- [`993a770`](https://github.com/serenity-kit/opaque/commit/993a7702ed8a1ca5f49a6e8d4057f6226333d280) Thanks [@nikgraf](https://github.com/nikgraf)! - Publishing via the CI

_Changesets was adopted in 0.8.1. The entries below were reconstructed from the git history and are not exhaustive._

## 0.8.0

### Minor Changes

- Add the `get-server-public-key` CLI script and `server.getPublicKey`, plus tests verifying it matches the key from registration and login
- Update the `opaque-ke` dependency
- Remove the production warning from the WASM build
- Add error handling tests for `client.finishLogin`, `client.finishRegistration` and `server.finishLogin`
- Examples: new fullstack encrypted locker example with recovery, Redis storage support, `.env` based configuration and session expiry

## 0.7.0

### Minor Changes

- Split the API into `client` and `server` namespaces through wrapper module re-exports
- Refactor API names and parameters
- Bundle TypeScript declarations with the dts rollup plugin
- Remove `wee_alloc`
- Typecheck the tests and all examples in CI

## 0.6.0

### Minor Changes

- Update the `opaque-ke` dependency to the latest version
- Set the root package to private and rename the publish script to `publish:all`

## 0.5.0

### Minor Changes

- Add the `create-server-setup` bin script to the build
- Examples: new Next.js fullstack example and a password reset example

## 0.4.0

### Minor Changes

- Switch the build to wasm-bindgen and rollup, inlining the WASM into the JS bundle
- Add clippy to the lint workflow

## 0.3.0

### Minor Changes

- Rename `serverSetup` to `createServerSetup`
- Rename `credentialIdentifier` to `userIdentifier` and remove it from `clientRegistrationFinish`
- Restructure the examples directory and add a Vite example

## 0.2.0

### Minor Changes

- Initial release. A P-256 (NIST P-256) build of `@serenity-kit/opaque`, published alongside the default Ristretto255 build
- Add `credentialIdentifier` and make `clientIdentifier` optional
- Pass custom identifiers as a nested optional object
- Make `passwordFile` optional to allow returning a dummy login response
