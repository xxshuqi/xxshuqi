import type { Metadata } from "next";
import "@/styles/globals.css";
import PublicShell from "@/components/layout/PublicShell";

const SITE_URL = "https://thewanderingbunny.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "The Wandering Bunny — Photo Portfolio",
  description: "A minimalist Fujifilm photo portfolio.",
  openGraph: {
    title: "The Wandering Bunny — Photo Portfolio",
    description: "A minimalist Fujifilm photo portfolio.",
    type: "website",
    url: SITE_URL,
    siteName: "The Wandering Bunny",
  },
  twitter: {
    card: "summary",
    title: "The Wandering Bunny — Photo Portfolio",
    description: "A minimalist Fujifilm photo portfolio.",
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
      </body>
    </html>
  );
}
