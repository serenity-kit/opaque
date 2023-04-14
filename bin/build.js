const shell = require("shelljs");

const version = "0.1.0";

shell.rm("-rf", "build");

shell.exec("wasm-pack build --target bundler --out-dir build/esm");
shell.exec("wasm-pack build --target nodejs --out-dir build/cjs");

shell.rm("build/esm/.gitignore");
shell.rm("build/cjs/.gitignore");

shell.rm("build/esm/package.json");
shell.rm("build/cjs/package.json");

const packageJson = `{
  "name": "opaque",
  "collaborators": [
    "Stefan Oestreicher <oestef@gmail.com>",
    "Nik Graf <nik@nikgraf.com>"
  ],
  "version": "${version}",
  "license" : "MIT",
  "files": [
    "esm/opaque_bg.wasm",
    "esm/opaque_bg.d.ts",
    "esm/opaque.js",
    "esm/opaque.d.ts",
    "esm/opaque_bg.js",
    "cjs/opaque_bg.wasm",
    "cjs/opaque_bg.d.ts",
    "cjs/opaque.js",
    "cjs/opaque.d.ts"
  ],
  "module": "esm/opaque.js",
  "types": "esm/opaque.d.ts",
  "main": "cjs/opaque.js",
  "browser": "esm/opaque.js"
}
`;

new shell.ShellString(packageJson).to("./build/package.json");

shell.cp("README.md", "build/README.md");
shell.cp("LICENSE", "build/LICENSE");
