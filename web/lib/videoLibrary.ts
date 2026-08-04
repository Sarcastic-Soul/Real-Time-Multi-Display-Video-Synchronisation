import { VideoMeta } from "./types";

export const SAMPLE_VIDEOS: VideoMeta[] = [
  {
    id: "sample-1",
    title: "Sintel 3D Movie Trailer (52s)",
    url: "/videos/sintel-trailer.mp4",
    durationSec: 52,
  },
  {
    id: "sample-2",
    title: "Oceans Nature Documentary (46s)",
    url: "/videos/oceans.mp4",
    durationSec: 46,
  },
  {
    id: "sample-3",
    title: "City Traffic & Motion (54s)",
    url: "/videos/street-traffic.mp4",
    durationSec: 54,
  },
];

export function getVideoById(id: string | null): VideoMeta | undefined {
  if (!id) return SAMPLE_VIDEOS[0];
  return SAMPLE_VIDEOS.find((v) => v.id === id) || SAMPLE_VIDEOS[0];
}
