import React from "react";
import { VideoPlayer } from "@/components/display/VideoPlayer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisplayPage({ params }: PageProps) {
  const { id } = await params;

  return <VideoPlayer clientId={id} />;
}
