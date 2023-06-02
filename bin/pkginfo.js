const { execFileSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const pkg = JSON.parse(readFileSync(path.join(__dirname, "../package.json")));

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
    "index.d.ts",
    "esm/index.js",
    "cjs/index.js"
  ],
  "module": "esm/index.js",
  "types": "index.d.ts",
  "main": "cjs/index.js",
  "browser": "esm/index.js"
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

if (process.platform === "win32") {
  execFileSync(path.join(__dirname, "pkginfo.bat"), {
    stdio: "inherit",
  });
} else {
  execFileSync(path.join(__dirname, "pkginfo.sh"), {
    stdio: "inherit",
  });
}
