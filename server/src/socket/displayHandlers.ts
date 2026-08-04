import { Server, Socket } from "socket.io";
import { SessionStateManager } from "../state/sessionState.js";
import { DisplayRegistry } from "../state/displayRegistry.js";
import { DisplayRegisterSchema, DisplayStatusReportSchema } from "../validation.js";

export function setupDisplayHandlers(
  io: Server,
  socket: Socket,
  sessionState: SessionStateManager,
  displayRegistry: DisplayRegistry
): void {
  socket.on("display:register", (rawPayload: unknown) => {
    const parseResult = DisplayRegisterSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      socket.emit("error", {
        message: "Invalid display:register payload",
        errors: parseResult.error.format(),
      });
      return;
    }

    const { clientId } = parseResult.data;
    displayRegistry.registerDisplay(clientId, socket.id);

    const now = Date.now();
    const currentState = sessionState.getState();
    const expectedPos = sessionState.getExpectedPositionSec(now);

    // Send immediate initial session state to newly connected display
    socket.emit("session:state", currentState);

    // Notify controller of updated display registry
    io.emit("session:displays", displayRegistry.getDisplaysReport(expectedPos, now));
  });

  socket.on("display:statusReport", (rawPayload: unknown) => {
    const parseResult = DisplayStatusReportSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      return;
    }

    const { clientId, positionSec, status } = parseResult.data;
    const now = Date.now();
    const expectedPos = sessionState.getExpectedPositionSec(now);

    displayRegistry.updateStatusReport(clientId, positionSec, status, expectedPos, now);

    // Send updated display status table to controller
    io.emit("session:displays", displayRegistry.getDisplaysReport(expectedPos, now));
  });

  socket.on("disconnect", () => {
    const disconnectedClientId = displayRegistry.handleDisconnectBySocketId(socket.id);
    if (disconnectedClientId) {
      const now = Date.now();
      const expectedPos = sessionState.getExpectedPositionSec(now);
      io.emit("session:displays", displayRegistry.getDisplaysReport(expectedPos, now));
    }
  });
}
