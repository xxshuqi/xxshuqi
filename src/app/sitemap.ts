import type { MetadataRoute } from "next";

const SITE_URL = "https://thewanderingbunny.com";

// Required by output: "export" — without it the build fails collecting this route.
export const dynamic = "force-static";

// No lastModified: it would be evaluated at build time, so every deploy would
// claim both pages changed even when only the CSS moved. A wrong date is a
// worse signal than no date.
//
// /portfolio/ is deliberately absent: it is a redirect whose canonical points
// home, so listing it would invite indexing of a page we want folded into "/".
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
