const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
  },
  mode: "development",
  plugins: [new CopyWebpackPlugin({ patterns: ["index.html"] })],
  // Since webpack 5 WebAssembly is not enabled by default and flagged as experimental feature.
  experiments: {
    asyncWebAssembly: true,
  },
};
