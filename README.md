# Opaque

## Development

We are using `pnpm`.

To run the wasm-pack builds for both nodejs and bundler targets you can run

```
pnpm build
```

### example-server

A server-side nodejs example is currently located in `./example-server`.
It depends on the built `./dist/nodejs` directory.
After running `pnpm install` in the example-server directory you can start the server by executing the `server.js` file with node:

```
node ./server.js
```

To quickly verify that it actually works you can run the `client.js` script which will try to register a user and login:

```
node ./client.js
```

### example-client

An client-side example login/registration form is currently located in `./example-client`.
It depends on the built `./dist/bundler` directory.
In the example directory you can run

```
pnpm install
pnpm start
```

to run the example. On form submit it will attempt to register/login with the example-server running at `localhost:8089` (currently hardcoded)
so you need to have the server running to try it.

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
