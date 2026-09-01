import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // font-list's own internal require("./libs/core") assumes its
      // relative path from within node_modules/font-list — bundling
      // (inlining) it flattens that into .vite/build/main.js, breaking the
      // relative path entirely ("Cannot find module './libs/core'").
      // Marking it external leaves the require() call as-is, resolved
      // normally from node_modules at runtime (present in both dev and a
      // packaged build, since it's a regular dependency).
      external: ["font-list"]
    }
  }
});
