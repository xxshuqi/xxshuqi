import { getPhotos } from "@/lib/data";
import EvfPortfolio from "@/components/home/EvfPortfolio";

export default function GalleryPage() {
  const photos = getPhotos();
  return <EvfPortfolio photos={photos} />;
}
