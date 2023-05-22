const { execFileSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const pkg = JSON.parse(readFileSync(path.join(__dirname, "../package.json")));

if (process.platform === "win32") {
  execFileSync(path.join(__dirname, "build.bat"), {
    stdio: "inherit",
  });
} else {
  execFileSync(path.join(__dirname, "build.sh"), {
    stdio: "inherit",
  });
}

const packageJson = function (name) {
  return `{
  "name": "@serenity-kit/${name}",
  "collaborators": [
    "Stefan Oestreicher <oestef@gmail.com>",
    "Nik Graf <nik@nikgraf.com>"
  ],
  "version": "${pkg.version}",
  "license": "MIT",
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
}`;
};

writeFileSync(
  path.join(__dirname, "../build/ristretto/package.json"),
  packageJson("opaque")
);
writeFileSync(
  path.join(__dirname, "../build/p256/package.json"),
  packageJson("opaque-p256")
);
