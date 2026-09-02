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
      //
      // happy-dom (used by @tiptap/html/server for DOCX import's HTML->JSON
      // parsing) transitively pulls in `ws`, whose optional native
      // performance deps (bufferutil, utf-8-validate — legitimately not
      // installed; ws itself soft-fails their absence at runtime) get
      // resolved as hard, unconditional requires once esbuild bundles them
      // into main.js, crashing on startup with "Could not resolve
      // 'bufferutil'". Marking happy-dom external avoids bundling that whole
      // transitive tree — Node's real require() at runtime handles ws's own
      // optional-dependency fallback correctly, same as it always does
      // outside a bundler.
      external: ["font-list", "happy-dom"]
    }
  }
});
