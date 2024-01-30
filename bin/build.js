const sh = require("shelljs");
const path = require("path");

// throw if a command fails
sh.config.fatal = true;

const ristrettoPackageJson = JSON.parse(
  sh
    .cat(path.join(__dirname, "..", "build", "ristretto", "package.json"))
    .toString(),
);

const packageJson = function (name) {
  return new sh.ShellString(`{
  "name": "@serenity-kit/${name}",
  "description": "Secure password based client-server authentication without the server ever obtaining knowledge of the password. Implementation of the OPAQUE protocol.",
  "collaborators": [
    "Stefan Oestreicher <oestef@gmail.com>",
    "Nik Graf <nik@nikgraf.com>"
  ],
  "version": "${ristrettoPackageJson.version}",
  "license": "MIT",
  "files": [
    "index.d.ts",
    "esm/index.js",
    "cjs/index.js"
  ],
  "module": "esm/index.js",
  "types": "index.d.ts",
  "main": "cjs/index.js",
  "browser": "esm/index.js",
  "bin": {
    "create-server-setup": "./create-server-setup.js",
    "get-server-public-key": "./get-server-public-key.js"
  },
  "repository": "github:serenity-kit/opaque",
  "publishConfig": {
    "provenance": true
  }
}`);
};

const createServerSetupBin = new sh.ShellString(`#!/usr/bin/env node
const opaque = require('.')
opaque.ready.then(() => {
    console.log(opaque.server.createSetup())
})
`);

const getServerPublicKeyBin = new sh.ShellString(`#!/usr/bin/env node
const opaque = require('.')
opaque.ready.then(() => {
    if (process.argv.length < 3) {
      console.error("ERROR: missing argument <SERVER_SETUP>")
      process.exit(1)
    }
    try {
      console.log(opaque.server.getPublicKey(process.argv[2]))
    } catch (err) {
      console.error("ERROR! Failed to extract public key.")
      console.error(err.message + "\\n")
      console.error("Did you supply a valid SERVER_SETUP string?")
      process.exit(1)
    }
})
`);

function build_wbg() {
  sh.exec("cargo build --target=wasm32-unknown-unknown --release");
  sh.exec(
    "wasm-bindgen --out-dir=build/wbg_ristretto --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm",
  );
  sh.exec(
    "cargo build --target=wasm32-unknown-unknown --release --features p256",
  );
  sh.exec(
    "wasm-bindgen --out-dir=build/wbg_p256 --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm",
  );
}

function rollup(name) {
  sh.exec("pnpm rollup -c", {
    env: {
      ...process.env,
      BUILD_ENTRY: name,
    },
  });
}

function tsc(entry) {
  // Run tsc primarily to generate d.ts declaration files.
  // Our inputs are only ts files because we need to re-export types.
  // The target option is not that important because the result will be used as entry point for rollup.
  sh.exec(
    `pnpm tsc ${entry} --declaration --module es2020 --target es2020 --moduleResolution nodenext --removeComments`,
  );
}

function main() {
  sh.rm("-rf", "build");

  // build rust code and generate wasm bindings
  build_wbg();

  // copy wrapper module templates
  sh.cp("bin/templates/*", "build/wbg_ristretto");
  sh.cp("bin/templates/*", "build/wbg_p256");

  // run tsc on our entry module wrapper
  tsc("build/wbg_ristretto/index.ts");
  tsc("build/wbg_p256/index.ts");

  // run rollup to bundle the js with wasm inlined and also bundle d.ts files
  rollup("ristretto");
  rollup("p256");

  // write package json
  packageJson("opaque").to("build/ristretto/package.json");
  packageJson("opaque-p256").to("build/p256/package.json");

  // write create-server-setup bin script
  createServerSetupBin.to("build/ristretto/create-server-setup.js");
  createServerSetupBin.to("build/p256/create-server-setup.js");

  // write get-server-public-key bin script
  getServerPublicKeyBin.to("build/ristretto/get-server-public-key.js");
  getServerPublicKeyBin.to("build/p256/get-server-public-key.js");

  // copy docs
  sh.cp("README.md", "build/ristretto/README.md");
  sh.cp("README.md", "build/p256/README.md");
  sh.cp("LICENSE", "build/ristretto/LICENSE");
  sh.cp("LICENSE", "build/p256/LICENSE");
}

main();
