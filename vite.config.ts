import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// CSP is injected only into the production build (the packaged Electron app);
// the dev server needs inline scripts and websockets for HMR.
const ELECTRON_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "electron-csp",
      apply: "build",
      transformIndexHtml(html) {
        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${ELECTRON_CSP}">`
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 32112,
  },
});
