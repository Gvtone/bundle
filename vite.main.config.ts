import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // NOTE: marking a package external here only works for a packaged
      // build if its files genuinely exist in node_modules at runtime.
      // @electron-forge/plugin-vite's packagerConfig.ignore keeps ONLY the
      // `.vite` output directory in a packaged app — node_modules (and
      // everything else) is never copied in. An external package resolves
      // fine in dev (npm start runs straight from the project directory,
      // real node_modules and all) but throws "Cannot find module" the
      // instant a packaged app's main.js hits that require() at runtime.
      // happy-dom (used by @tiptap/html/server for DOCX import's HTML->JSON
      // parsing, eagerly imported by docx-import.ts, required unconditionally
      // by ipc-handlers.ts at app startup) is pure JS with no native binary
      // and bundles cleanly — inlining it (i.e. NOT marking it external) is
      // correct. font-list used to be imported the same way (system-fonts.ts)
      // but its platform-conditional internal require() structure made
      // Rollup fall back to a real runtime createRequire() call instead of
      // fully inlining it — same "Cannot find module" failure, just one step
      // removed. Rather than fight the bundler further, system-fonts.ts now
      // inlines the one PowerShell-based function this app actually used
      // from it directly (no relative requires, no platform switch — fully
      // bundle-safe on its own), and the font-list dependency was dropped
      // entirely.
      //
      // ws (a transitive dep of happy-dom, via @tiptap/html/server's DOM
      // parsing) is the one genuine remaining exception: it optionally loads
      // performance-native addons (bufferutil, utf-8-validate) wrapped in
      // its own try/catch, already tolerant of them being absent — that's
      // the standard optional-dependency pattern, and it's how this exact
      // code already behaves unbundled in dev. Neither package is actually
      // installed (by design). esbuild, when asked to bundle a require()
      // target it can't resolve at all, throws a hard build error instead
      // of leaving the runtime require() call alone — so these two need to
      // stay external not because their real files must exist at runtime
      // (they don't, and never will), but purely to stop the bundler from
      // trying to resolve them. The resulting inert require() calls hit
      // ws's own try/catch exactly like they do outside a bundler.
      external: ["bufferutil", "utf-8-validate"]
    }
  }
});
