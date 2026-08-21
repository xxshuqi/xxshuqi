import { getPhotos } from "@/lib/data";
import SiteShell from "@/components/layout/SiteShell";
import PortfolioClient from "@/components/portfolio/PortfolioClient";

export default function PortfolioPage() {
  const photos = getPhotos();

  return (
    <SiteShell>
      <PortfolioClient photos={photos} />
    </SiteShell>
  );
}
