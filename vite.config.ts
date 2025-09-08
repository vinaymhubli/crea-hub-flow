import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createRequire } from "module";

// Agora token API plugin for dev server
function agoraTokenPlugin() {
  return {
    name: 'agora-token-api',
    configureServer(server: any) {
      server.middlewares.use("/api/agora/token", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await new Promise<any>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on("data", (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            req.on("end", () => {
              try {
                const raw = Buffer.concat(chunks).toString("utf8");
                resolve(raw ? JSON.parse(raw) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on("error", reject);
          });

          const uid = String(body?.uid || "").trim();
          const channel = String(body?.channel || "").trim();
          const asSharer = Boolean(body?.asSharer);

          // Hardcoded Agora credentials for testing
          const APP_ID = "9f26de32fa2546839b41ffbf0ad0cfb9";
          const APP_CERT = "bfe2d626b93d4665aa1756b7ab56780c";
          const ttl = 36000;

          console.log("Agora credentials debug:", {
            APP_ID: APP_ID ? `✓ Set (${APP_ID.substring(0, 8)}...)` : "✗ Missing",
            APP_CERT: APP_CERT ? `✓ Set (${APP_CERT.substring(0, 8)}...)` : "✗ Missing"
          });
          if (!uid || !channel) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "uid and channel are required" }));
            return;
          }

          const require = createRequire(import.meta.url);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const agoraToken = require("agora-token");

          console.log("Agora token module:", Object.keys(agoraToken));

          // Handle both CommonJS default export and named exports
          const { RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken.default || agoraToken;

          const now = Math.floor(Date.now() / 1000);
          const expireAt = now + ttl;
          const rtcRole = asSharer ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

          const rtcToken = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERT,
            channel,
            uid,
            rtcRole,
            expireAt
          );
          const rtmToken = RtmTokenBuilder.buildToken(
            APP_ID,
            APP_CERT,
            uid,
            expireAt
          );

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ appId: APP_ID, channel, uid, rtcToken, rtmToken, expireAt }));
        } catch (e: any) {
          console.error("Agora token API error:", e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e?.message || "Internal server error" }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      agoraTokenPlugin(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
