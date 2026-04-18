import { getPhotos } from "@/lib/data";
import GalleryClient from "./GalleryClient";

export default function GalleryPage() {
  const photos = getPhotos();
  // GalleryClient handles its own Suspense boundary internally (for useSearchParams only)
  return <GalleryClient photos={photos} />;
}
