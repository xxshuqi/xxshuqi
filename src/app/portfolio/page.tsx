import type { Metadata } from "next";
import RedirectTo from "@/components/layout/RedirectTo";

// Kept only so the old URL doesn't 404 — the portfolio now lives at the root.
// The canonical points home so search engines fold this into "/" instead of
// indexing it as a second copy. Safe to delete once it drops out of the index.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function PortfolioRedirectPage() {
  return <RedirectTo to="/" label="Continue to The Wandering Bunny" />;
}
