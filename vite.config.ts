import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function apiPlugin(): Plugin {
  return {
    name: "api-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const routeName = url.pathname.replace(/^\/api\//, "").split("?")[0];
        
        try {
          const mod = await server.ssrLoadModule(`./api/${routeName}.ts`);
          const handler = mod.default;
          if (handler) {
            if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
              let body = "";
              req.on("data", (chunk) => { body += chunk; });
              req.on("end", () => {
                try { (req as any).body = JSON.parse(body || "{}"); } catch { (req as any).body = {}; }
                (req as any).query = Object.fromEntries(url.searchParams.entries());
                (res as any).status = (statusCode: number) => {
                  res.statusCode = statusCode;
                  return {
                    json: (data: any) => {
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify(data));
                    },
                    end: () => res.end()
                  };
                };
                handler(req, res);
              });
            } else {
              (req as any).query = Object.fromEntries(url.searchParams.entries());
              (res as any).status = (statusCode: number) => {
                res.statusCode = statusCode;
                return {
                  json: (data: any) => {
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end()
                };
              };
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

export default defineConfig(({ mode }) => ({
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
