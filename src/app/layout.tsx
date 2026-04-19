import type { Metadata } from "next";
import "@/styles/globals.css";
import PublicShell from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "The Wandering Bunny - Photo Diary",
  description:
    "A personal photo diary. Slow moments, quiet streets, and honest light — captured on Fujifilm.",
  openGraph: {
    title: "The Wandering Bunny - Photo Diary",
    description: "A personal Fujifilm photo diary",
    type: "website",
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
