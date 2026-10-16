import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const api = `http://127.0.0.1:${process.env.CT_API_PORT || 8001}`;
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.CT_WEB_PORT || 5173),
    strictPort: true,
    proxy: { "/api": { target: api, ws: true }, "/auth": api, "/healthz": api },
  },
  build: { target: "es2022" },
});
