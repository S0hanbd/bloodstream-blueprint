import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { IncomingMessage, ServerResponse } from "http";

interface ExtendedReq extends IncomingMessage {
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

interface ExtendedRes extends ServerResponse {
  status?: (statusCode: number) => {
    json: (data: unknown) => void;
    end: () => void;
  };
}

function apiPlugin(): Plugin {
  return {
    name: "api-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req: ExtendedReq, res: ExtendedRes, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const routeName = url.pathname.replace(/^\/api\//, "").split("?")[0];
        
        try {
          const mod = await server.ssrLoadModule(`./api/${routeName}.ts`);
          const handler = mod.default;
          if (handler) {
            const statusFn = (statusCode: number) => {
              res.statusCode = statusCode;
              return {
                json: (data: unknown) => {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
                end: () => res.end(),
              };
            };
            res.status = statusFn;
            req.query = Object.fromEntries(url.searchParams.entries());

            if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
              let body = "";
              req.on("data", (chunk: Buffer | string) => { body += chunk.toString(); });
              req.on("end", () => {
                try { req.body = JSON.parse(body || "{}"); } catch { req.body = {}; }
                handler(req, res);
              });
            } else {
              handler(req, res);
            }
            return;
          }
        } catch (e) {
          console.error(`API route error for ${req.url}:`, e);
        }
        next();
      });
    },
  };
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
