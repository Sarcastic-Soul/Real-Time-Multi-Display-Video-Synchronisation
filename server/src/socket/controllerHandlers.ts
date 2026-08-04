import { Server, Socket } from "socket.io";
import { SessionStateManager } from "../state/sessionState.js";
import { DisplayRegistry } from "../state/displayRegistry.js";
import { ControllerCommandSchema } from "../validation.js";

export function setupControllerHandlers(
  io: Server,
  socket: Socket,
  sessionState: SessionStateManager,
  displayRegistry: DisplayRegistry
): void {
  socket.on("controller:command", (rawPayload: unknown) => {
    const parseResult = ControllerCommandSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      socket.emit("error", {
        message: "Invalid controller command payload",
        errors: parseResult.error.format(),
      });
      return;
    }

    const command = parseResult.data;
    const roomId = (command as any).roomId || "default-room";
    const now = Date.now();
    const updatedState = sessionState.applyCommand(command, now);
    const expectedPos = sessionState.getExpectedPositionSec(roomId, now);

    // Broadcast session state & display command to all connected sockets
    io.emit("session:state", updatedState);
    io.emit("display:command", command);

    // Broadcast display table update to controller
    io.emit("session:displays", displayRegistry.getDisplaysReport(expectedPos, now, roomId));
  });
}
