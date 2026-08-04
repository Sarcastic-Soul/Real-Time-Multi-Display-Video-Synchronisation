import { z } from "zod";

export const ControllerCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SELECT_VIDEO"),
    videoId: z.string().min(1),
  }),
  z.object({
    type: z.literal("PLAY"),
  }),
  z.object({
    type: z.literal("PAUSE"),
  }),
  z.object({
    type: z.literal("SEEK"),
    positionSec: z.number().min(0),
  }),
  z.object({
    type: z.literal("RESTART"),
  }),
]);

export const DisplayRegisterSchema = z.object({
  clientId: z.string().min(1),
});

export const DisplayStatusReportSchema = z.object({
  clientId: z.string().min(1),
  positionSec: z.number(),
  status: z.enum(["playing", "paused", "loading"]),
});
