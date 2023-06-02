const { wasm } = require("@rollup/plugin-wasm");
const terser = require("@rollup/plugin-terser");

const entryName = process.env["BUILD_ENTRY"];
if (!entryName) {
  console.error("BUILD_ENTRY env not set");
  process.exit(1);
}

module.exports = {
  input: `build/wbg_${entryName}/index.js`,
  output: [
    {
      dir: "build",
      format: "cjs",
      entryFileNames: `${entryName}/cjs/index.js`,
    },
    {
      dir: "build",
      format: "esm",
      entryFileNames: `${entryName}/esm/index.js`,
    },
  ],

  plugins: [
    wasm({ maxFileSize: 10000000, targetEnv: "auto-inline" }),
    terser(),
  ],
};
