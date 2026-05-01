import type { Metadata } from "next";
import { getPhotos } from "@/lib/data";
import JourneysClient from "./JourneysClient";

export const metadata: Metadata = {
  title: "Journeys — The Wandering Bunny.",
  description:
    "Where I've been. An interactive globe of every place this diary has wandered through.",
};

export default function JourneysPage() {
  const photos = getPhotos();
  return <JourneysClient photos={photos} />;
}
