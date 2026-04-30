import { Suspense } from "react";
import { getPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";

export default function GalleryPage() {
  const photos = getPhotos();
  return (
    <Suspense fallback={null}>
      <GalleryClient photos={photos} />
    </Suspense>
  );
}
