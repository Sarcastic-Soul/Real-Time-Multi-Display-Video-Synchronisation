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

// Reverse proxy non-socket HTTP requests to Next.js frontend running on port 3000
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) {
    return next();
  }
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
    res.status(502).send("Frontend application is starting up...");
  });

  req.pipe(proxyReq, { end: true });
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
