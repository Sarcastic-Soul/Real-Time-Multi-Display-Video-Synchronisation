import express from "express";
import { createServer, request as httpRequest } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PORT, TICK_INTERVAL_MS } from "./constants.js";
import { SessionStateManager } from "./state/sessionState.js";
import { DisplayRegistry } from "./state/displayRegistry.js";
import { setupControllerHandlers } from "./socket/controllerHandlers.js";
import { setupDisplayHandlers } from "./socket/displayHandlers.js";

const app = express();
app.use(cors({ origin: "*" }));

// Reverse proxy non-socket HTTP requests to Next.js frontend running on 127.0.0.1:3000
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) {
    return next();
  }

  const attemptProxy = (retriesLeft: number) => {
    const proxyReq = httpRequest(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", () => {
      if (retriesLeft > 0) {
        setTimeout(() => attemptProxy(retriesLeft - 1), 500);
      } else {
        res.status(502).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>App Initializing...</title>
              <meta http-equiv="refresh" content="2">
            </head>
            <body style="background-color:#020617;color:#94a3b8;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="text-align:center;padding:24px;background:#0f172a;border:1px solid #1e293b;border-radius:16px;max-width:400px;">
                <div style="width:12px;height:12px;background:#38bdf8;border-radius:50%;margin:0 auto 16px auto;animation:pulse 1s infinite alternate;"></div>
                <h3 style="color:#f8fafc;margin:0 0 8px 0;font-size:18px;">Application Starting Up</h3>
                <p style="font-size:13px;color:#64748b;margin:0;">Connecting gateway to frontend service. Page will reload automatically in 2 seconds...</p>
              </div>
            </body>
          </html>
        `);
      }
    });

    req.pipe(proxyReq, { end: true });
  };

  attemptProxy(3);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const sessionState = new SessionStateManager();
const displayRegistry = new DisplayRegistry();

io.on("connection", (socket) => {
  // Immediate state sync upon socket connection
  socket.emit("session:state", sessionState.getState("default-room"));

  setupControllerHandlers(io, socket, sessionState, displayRegistry);
  setupDisplayHandlers(io, socket, sessionState, displayRegistry);
});

// Server Tick Loop (every TICK_INTERVAL_MS)
setInterval(() => {
  const now = Date.now();
  const state = sessionState.getState("default-room");
  const expectedPositionSec = sessionState.getExpectedPositionSec("default-room", now);

  // Broadcast current state to all connected sockets
  io.emit("session:state", state);

  // Broadcast updated display reports to controller(s)
  io.emit("session:displays", displayRegistry.getDisplaysReport(expectedPositionSec, now, "default-room"));
}, TICK_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`🚀 Video Sync Server & Web Gateway running on http://localhost:${PORT}`);
});
