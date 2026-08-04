import { DisplayStatusReport, PlaybackStatus } from "../types.js";

interface InternalDisplayRecord {
  clientId: string;
  socketId: string;
  connected: boolean;
  positionSec: number;
  status: PlaybackStatus;
  driftMs: number;
  lastReportAt: number;
}

export class DisplayRegistry {
  private displays: Map<string, InternalDisplayRecord> = new Map();

  public registerDisplay(clientId: string, socketId: string): void {
    const existing = this.displays.get(clientId);
    this.displays.set(clientId, {
      clientId,
      socketId,
      connected: true,
      positionSec: existing ? existing.positionSec : 0,
      status: existing ? existing.status : "paused",
      driftMs: existing ? existing.driftMs : 0,
      lastReportAt: Date.now(),
    });
  }

  public updateStatusReport(
    clientId: string,
    positionSec: number,
    status: PlaybackStatus,
    expectedPositionSec: number,
    now: number = Date.now()
  ): void {
    const display = this.displays.get(clientId);
    if (!display) return;

    const driftMs = Math.round((positionSec - expectedPositionSec) * 1000);

    display.positionSec = positionSec;
    display.status = status;
    display.driftMs = driftMs;
    display.lastReportAt = now;
    display.connected = true;
  }

  public handleDisconnectBySocketId(socketId: string): string | null {
    for (const [clientId, display] of this.displays.entries()) {
      if (display.socketId === socketId) {
        display.connected = false;
        return clientId;
      }
    }
    return null;
  }

  public getDisplaysReport(expectedPositionSec: number, now: number = Date.now()): DisplayStatusReport[] {
    const reports: DisplayStatusReport[] = [];
    for (const display of this.displays.values()) {
      // Re-evaluate drift dynamically for active reports
      const currentDriftMs = display.connected
        ? Math.round((display.positionSec - expectedPositionSec) * 1000)
        : display.driftMs;

      reports.push({
        clientId: display.clientId,
        connected: display.connected,
        positionSec: display.positionSec,
        status: display.status,
        driftMs: currentDriftMs,
        lastReportAt: display.lastReportAt,
      });
    }
    return reports;
  }
}
