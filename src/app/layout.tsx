import type { Metadata } from "next";
import "@/styles/globals.css";
import PublicShell from "@/components/layout/PublicShell";

const SITE_URL = "https://thewanderingbunny.com";
const DEFAULT_OG_IMAGE = "/uploads/originals/tokyo-092.jpg"; // Mt. Fuji, the featured photo

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "The Wandering Bunny — Photo Diary",
  description:
    "A personal photo diary. Slow moments, quiet streets, and honest light, captured on Fujifilm.",
  openGraph: {
    title: "The Wandering Bunny — Photo Diary",
    description:
      "A personal photo diary. Slow moments, quiet streets, and honest light, captured on Fujifilm.",
    type: "website",
    url: SITE_URL,
    siteName: "The Wandering Bunny",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 2400,
        height: 1600,
        alt: "Mt. Fuji from Lake Yamanaka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wandering Bunny — Photo Diary",
    description:
      "A personal photo diary. Slow moments, quiet streets, and honest light, captured on Fujifilm.",
    images: [DEFAULT_OG_IMAGE],
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
          href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=DM+Sans:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
