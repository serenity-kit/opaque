const sh = require("shelljs");

// throw if a command fails
sh.config.fatal = true;

const rootPkg = JSON.parse(sh.cat("package.json").toString());

const entryModule = new sh.ShellString(`
import wasmData from './opaque_bg.wasm'
import init from './opaque'
export const ready = init(wasmData())
export * from './opaque'
// This default export is not strictly necessary and is the reason why
// rollup complains about mixing named and default exports.
// We have it here because it is declared in the generated d.ts file
// and strictly speaking our types would be wrong if we remove this export.
// We could modify the d.ts file to remove the type declaration as part of the build
// but that introduces more fragility to the build process with no real benefit.
export {default} from './opaque'
`);

const packageJson = function (name) {
  return new sh.ShellString(`{
  "name": "@serenity-kit/${name}",
  "collaborators": [
    "Stefan Oestreicher <oestef@gmail.com>",
    "Nik Graf <nik@nikgraf.com>"
  ],
  "version": "${rootPkg.version}",
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

  // write entry module for intermediate builds
  entryModule.to("build/wbg_ristretto/index.js");
  entryModule.to("build/wbg_p256/index.js");

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
  sh.cp("build/wbg_ristretto/opaque.d.ts", "build/ristretto/index.d.ts");
  sh.cp("build/wbg_p256/opaque.d.ts", "build/p256/index.d.ts");

  // amend type defs
  const ts = new sh.ShellString("export const ready: Promise<void>;");
  ts.toEnd("build/ristretto/index.d.ts");
  ts.toEnd("build/p256/index.d.ts");
}

main();
