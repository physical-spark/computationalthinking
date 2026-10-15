import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
const core = readFileSync(new URL("./public/python-core.tar", import.meta.url));
const digest = createHash("sha256").update(core).digest("hex").slice(0, 16);
const fileName = `python-core.${digest}.tar.gz`;
const compressed = gzipSync(core, { level: 9 });
export default defineConfig({
  plugins: [
    {
      name: "compressed-python-core",
      generateBundle() {
        this.emitFile({ type: "asset", fileName, source: compressed });
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] !== "/" + fileName) return next();
          res.setHeader("Content-Type", "application/gzip");
          res.setHeader("Content-Length", compressed.length);
          res.end(compressed);
        });
      },
    },
  ],
  worker: { format: "es" },
  build: { target: "es2022" },
  server: { headers: { "Cross-Origin-Resource-Policy": "cross-origin" } },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __CT_PYTHON_CORE_URL__: JSON.stringify("/" + fileName),
  },
});
