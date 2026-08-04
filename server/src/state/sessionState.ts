import { SessionState, ControllerCommand } from "../types.js";

export class SessionStateManager {
  private state: SessionState;

  constructor() {
    this.state = {
      videoId: "sample-1", // default video
      status: "paused",
      positionAtLastUpdateSec: 0,
      lastUpdatedAt: Date.now(),
      seq: 0,
    };
  }

  public getState(): SessionState {
    return { ...this.state };
  }

  public getExpectedPositionSec(now: number = Date.now()): number {
    if (this.state.status === "paused") {
      return this.state.positionAtLastUpdateSec;
    }
    const elapsedSec = (now - this.state.lastUpdatedAt) / 1000;
    return Math.max(0, this.state.positionAtLastUpdateSec + elapsedSec);
  }

  public applyCommand(command: ControllerCommand, now: number = Date.now()): SessionState {
    const currentExpected = this.getExpectedPositionSec(now);

    switch (command.type) {
      case "SELECT_VIDEO":
        this.state = {
          videoId: command.videoId,
          status: "paused",
          positionAtLastUpdateSec: 0,
          lastUpdatedAt: now,
          seq: this.state.seq + 1,
        };
        break;

      case "PLAY":
        this.state = {
          ...this.state,
          status: "playing",
          positionAtLastUpdateSec: currentExpected,
          lastUpdatedAt: now,
          seq: this.state.seq + 1,
        };
        break;

      case "PAUSE":
        this.state = {
          ...this.state,
          status: "paused",
          positionAtLastUpdateSec: currentExpected,
          lastUpdatedAt: now,
          seq: this.state.seq + 1,
        };
        break;

      case "SEEK":
        this.state = {
          ...this.state,
          positionAtLastUpdateSec: Math.max(0, command.positionSec),
          lastUpdatedAt: now,
          seq: this.state.seq + 1,
        };
        break;

      case "RESTART":
        this.state = {
          ...this.state,
          positionAtLastUpdateSec: 0,
          lastUpdatedAt: now,
          seq: this.state.seq + 1,
        };
        break;
    }

    return this.getState();
  }
}
