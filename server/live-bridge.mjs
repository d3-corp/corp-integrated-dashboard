import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { connectGateway } from "./gateway.mjs";
import { toLivePayload } from "./map.mjs";

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
  [".json", "application/json"],
  [".woff2", "font/woff2"],
]);

function contentType(name) {
  return CONTENT_TYPES.get(path.extname(name).toLowerCase()) ?? "application/octet-stream";
}

function walkStatic(root, current = root, files = new Map()) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walkStatic(root, absolute, files);
    } else if (entry.isFile()) {
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      files.set(`/${relative}`, {
        file: absolute,
        type: contentType(entry.name),
      });
    }
  }
  return files;
}

export function publicError(error) {
  const message = String(error?.message || "");
  const status = message.match(/HTTP (\d{3})/);
  if (status) return `Action1 request failed (HTTP ${status[1]}).`;
  return "Cannot read Action1 data. Check the gateway command and unlock or authorize 1Password, then retry.";
}

export function createBridge({ distDir, getGateway = connectGateway, env = process.env }) {
  const root = distDir instanceof URL ? fileURLToPath(distDir) : distDir;
  const staticFiles = walkStatic(root);
  const indexFile = staticFiles.get("/index.html");

  let gatewayPromise;
  let liveFetchRunning = false;

  const gateway = () =>
    (gatewayPromise ||= getGateway(env).catch((error) => {
      gatewayPromise = null;
      throw error;
    }));

  const server = http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );

    const json = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
    };

    const port = server.address()?.port;
    const host = req.headers.host;
    const origin = req.headers.origin;
    const localHost =
      host === `127.0.0.1:${port}` || host === `localhost:${port}`;
    if (!localHost || (origin && origin !== `http://${host}`)) {
      return json(403, { error: "Local requests only." });
    }

    if (req.method !== "GET") {
      return json(405, { error: "Read-only." });
    }

    const url = new URL(req.url, `http://${host}`);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname !== "/api/live") {
        return json(404, { error: "Not found." });
      }
      if (liveFetchRunning) {
        return json(429, { error: "A live fetch is already running." });
      }
      liveFetchRunning = true;
      try {
        const client = await gateway();
        const organizations = await client.call("list_organizations", {
          limit: 100,
          maxPages: 10,
        });
        const wanted = env.ACTION1_ORGANIZATION_ID;
        let organization;
        if (wanted) {
          organization = organizations.items.find(
            (item) => item && item.id === wanted,
          );
          if (!organization) {
            return json(502, {
              error: "ACTION1_ORGANIZATION_ID is not available to this gateway.",
            });
          }
        } else {
          if (organizations.items.length !== 1) {
            return json(502, {
              error: "Set ACTION1_ORGANIZATION_ID to choose one organization.",
            });
          }
          organization = organizations.items[0];
        }

        const assets = await client.call("list_assets", {
          organizationId: organization.id,
          limit: 100,
          maxPages: 10,
        });
        return json(
          200,
          toLivePayload({
            organization: organization.name || organization.id,
            assets: assets.items,
            truncated: assets.truncated,
            fetchedAt: new Date().toISOString(),
          }),
        );
      } catch (error) {
        return json(502, { error: publicError(error) });
      } finally {
        liveFetchRunning = false;
      }
    }

    const staticFile = staticFiles.get(url.pathname) ?? indexFile;
    if (!staticFile) {
      return json(404, { error: "Not found." });
    }
    try {
      const body = await readFile(staticFile.file);
      res.writeHead(200, { "Content-Type": staticFile.type });
      res.end(body);
    } catch {
      return json(500, { error: "Dashboard file unavailable." });
    }
  });

  return {
    server,
    async close() {
      await new Promise((resolve) => server.close(() => resolve()));
      if (gatewayPromise) {
        try {
          const client = await gatewayPromise;
          await client.close();
        } catch {
          // The gateway never connected; there is nothing to close.
        }
      }
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = new URL("../dist/", import.meta.url);
  if (!existsSync(new URL("index.html", distDir))) {
    console.error("Run npm run build first.");
    process.exit(1);
  }

  const port = Number(process.env.LIVE_BRIDGE_PORT || "8787");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("LIVE_BRIDGE_PORT must be an integer from 1 to 65535.");
    process.exit(1);
  }

  const bridge = createBridge({ distDir });
  bridge.server.on("error", () => {
    console.error("Cannot start the live bridge. Check whether its port is already in use.");
    process.exit(1);
  });
  bridge.server.listen(port, "127.0.0.1", () => {
    console.log(`Corp Integrated Dashboard live bridge: http://127.0.0.1:${port}`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      await bridge.close();
      process.exit();
    });
  }
}
