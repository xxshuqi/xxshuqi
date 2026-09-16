import { getPhotos } from "@/lib/data";
import SiteShell from "@/components/layout/SiteShell";
import PortfolioClient from "@/components/portfolio/PortfolioClient";

// The portfolio IS the home page. It used to live at /portfolio/ with a meta
// refresh stub sitting here, which meant the site's own domain resolved to a
// 9KB page whose only text was "Continue to Portfolio".
export default function HomePage() {
  const photos = getPhotos();

  return (
    <SiteShell>
      <PortfolioClient photos={photos} />
    </SiteShell>
  );
}
