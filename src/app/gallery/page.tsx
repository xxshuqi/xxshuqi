import { Suspense } from "react";
import { getPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";

export default function GalleryPage() {
  const photos = getPhotos();

  return (
    // Suspense required by Next.js static export when useSearchParams is used inside
    <Suspense fallback={<div style={{ paddingTop: "52px" }} />}>
      <GalleryClient photos={photos} />
    </Suspense>
  );
}
