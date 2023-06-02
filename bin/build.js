const { execFileSync } = require("child_process");
const { writeFileSync } = require("fs");
const path = require("path");

if (process.platform === "win32") {
  execFileSync(path.join(__dirname, "build.bat"), {
    stdio: "inherit",
  });
} else {
  execFileSync(path.join(__dirname, "build.sh"), {
    stdio: "inherit",
  });
}

const entryModule = `
import wasmData from './opaque_bg.wasm'
import init from './opaque'
export const ready = init(wasmData())
export * from './opaque'
export {default} from './opaque'
`;

writeFileSync(
  path.join(__dirname, "../build/wbg_ristretto/index.js"),
  entryModule
);
writeFileSync(path.join(__dirname, "../build/wbg_p256/index.js"), entryModule);
