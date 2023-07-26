import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8089",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
