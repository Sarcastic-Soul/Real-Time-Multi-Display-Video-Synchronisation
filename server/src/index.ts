import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PORT, TICK_INTERVAL_MS } from "./constants.js";
import { SessionStateManager } from "./state/sessionState.js";
import { DisplayRegistry } from "./state/displayRegistry.js";
import { setupControllerHandlers } from "./socket/controllerHandlers.js";
import { setupDisplayHandlers } from "./socket/displayHandlers.js";

const app = express();
app.use(cors({ origin: "*" }));

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
  console.log(`🚀 Video Sync Server running on http://localhost:${PORT}`);
});
