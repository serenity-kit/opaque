const sh = require("shelljs");

// throw if a command fails
sh.config.fatal = true;

const rootPkg = JSON.parse(sh.cat("package.json").toString());

const packageJson = function (name) {
  return new sh.ShellString(`{
  "name": "@serenity-kit/${name}",
  "description": "Secure password based client-server authentication without the server ever obtaining knowledge of the password. Implementation of the OPAQUE protocol.",
  "collaborators": [
    "Stefan Oestreicher <oestef@gmail.com>",
    "Nik Graf <nik@nikgraf.com>"
  ],
  "version": "${rootPkg.version}",
  "license": "MIT",
  "files": [
    "types/index.d.ts",
    "types/client.d.ts",
    "types/opaque.d.ts",
    "types/server.d.ts",
    "esm/index.js",
    "cjs/index.js"
  ],
  "module": "esm/index.js",
  "types": "types/index.d.ts",
  "main": "cjs/index.js",
  "browser": "esm/index.js",
  "bin": {
    "create-server-setup": "./create-server-setup.js"
  }
}`);
};

const createServerSetupBin = new sh.ShellString(`#!/usr/bin/env node
const opaque = require('.')
opaque.ready.then(() => {
    console.log(opaque.createServerSetup())
})
`);

function build_wbg() {
  sh.exec("cargo build --target=wasm32-unknown-unknown --release");
  sh.exec(
    "wasm-bindgen --out-dir=build/wbg_ristretto --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm"
  );
  sh.exec(
    "cargo build --target=wasm32-unknown-unknown --release --features p256"
  );
  sh.exec(
    "wasm-bindgen --out-dir=build/wbg_p256 --target=web --omit-default-module-path target/wasm32-unknown-unknown/release/opaque.wasm"
  );
}

function bundle(name) {
  sh.exec("pnpm rollup -c", {
    env: {
      ...process.env,
      BUILD_ENTRY: name,
    },
  });
}

function main() {
  sh.rm("-rf", "build");

  // build rust code and generate wasm bindings
  build_wbg();

  // copy wrapper module templates
  sh.cp("bin/templates/*", "build/wbg_ristretto");
  sh.cp("bin/templates/*", "build/wbg_p256");

  sh.exec(
    "npx tsc build/wbg_ristretto/index.ts --declaration --module es2020 --target es2020 --moduleResolution nodenext"
  );
  sh.exec(
    "npx tsc build/wbg_p256/index.ts --declaration --module es2020 --target es2020 --moduleResolution nodenext"
  );

  // rollup
  bundle("ristretto");
  bundle("p256");

  // write package json
  packageJson("opaque").to("build/ristretto/package.json");
  packageJson("opaque-p256").to("build/p256/package.json");

  createServerSetupBin.to("build/ristretto/create-server-setup.js");
  createServerSetupBin.to("build/p256/create-server-setup.js");

  // copy docs
  sh.cp("README.md", "build/ristretto/README.md");
  sh.cp("README.md", "build/p256/README.md");
  sh.cp("LICENSE", "build/ristretto/LICENSE");
  sh.cp("LICENSE", "build/p256/LICENSE");

  // copy type defs
  sh.mkdir("build/ristretto/types");
  sh.mkdir("build/p256/types");
  sh.cp("build/wbg_ristretto/*.d.ts", "build/ristretto/types");
  sh.cp("build/wbg_p256/*.d.ts", "build/p256/types");
}

main();
