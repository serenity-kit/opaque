# Opaque

## Development

We are using `pnpm`.

To run the wasm-pack builds for both nodejs and bundler targets you can run

```
pnpm build
```

This will run `wasm-pack` both for the nodejs and bundler target.
The build output is in `./dist/nodejs` and `./dist/bundler`.

### example

An client-side dummy is currently located in `./example`.
It depends on the built `./dist/bundler` directory.
In the example directory you can run

```
pnpm install
pnpm start
```

### example-node

A server-side nodejs example is currently located in `./example-node`.
It depends on the built `./dist/nodejs` directory.
After running `pnpm install` in the example-node directory you can start the server by executing the `main.js` file with node:

```
node ./main.js
```

To quickly verify that it actually works you can run the `client.js` script which will try to register a user and login:

```
node ./client.js
```

## Acknowledgement

This project was supported by the [Netidee funding campaign](https://www.netidee.at/).

<img
  src="https://user-images.githubusercontent.com/223045/225402556-e9f571f3-79fa-4bca-b017-af57d6afe744.jpg"
  alt="Netidee logo"
  width="125"
  height="38"
/>
