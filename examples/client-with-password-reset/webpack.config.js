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
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:8089",
        pathRewrite: { "^/api": "" },
      },
    },
  },
};
