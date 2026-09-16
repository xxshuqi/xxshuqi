import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import PublicShell from "@/components/layout/PublicShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE_URL = "https://thewanderingbunny.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No viewportFit: "cover". In Safari's normal browser mode its own chrome
  // already covers the status bar and home indicator, so cover bought nothing
  // but the full layout-viewport vs visual-viewport mismatch — which is what
  // opened the see-through strips above the header and below the fold.
  themeColor: "#ffffff",
};

const SITE_TITLE = "The Wandering Bunny: Life Through My Lens";

// Search engines pad a thin description with whatever text they can scrape off
// the page — the old 38-character one was getting the <title> and the wordmark
// appended to it in results. Roughly 150 characters is the space on offer.
const SITE_DESCRIPTION =
  "Taking photos and documenting life is my love language. A collection of places, people, and everyday moments I’ve met along the way.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Pages set a short `title` and get "About · The Wandering Bunny"; the home
    // page uses `default` as-is. Before this every page shipped the same title.
    default: SITE_TITLE,
    template: "%s · The Wandering Bunny",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    // Relative, so each page resolves its own against metadataBase. It was
    // hardcoded to the site root, which made /about/ share to social as home.
    url: "/",
    siteName: "The Wandering Bunny",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rock+3D&family=Inconsolata:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PublicShell>{children}</PublicShell>
        {/* Both are Vercel-only: they post to /_vercel/*, which exists only on
            Vercel. Harmless elsewhere — the beacon 404s and nothing breaks. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
