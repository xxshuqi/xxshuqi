import { getPhotos } from "@/lib/data";
import EvfPortfolio from "@/components/home/EvfPortfolio";

export const revalidate = 60;

export default function AboutPage() {
  const photos = getPhotos();
  return <EvfPortfolio photos={photos} initialView="about" />;
}
