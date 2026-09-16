import type { Metadata } from "next";
import SiteShell from "@/components/layout/SiteShell";

// Mirrors .about-photo in globals.css: a fixed 300px rail on desktop, and
// full-width capped at 320px below the 760px breakpoint. It decides which
// srcset candidate the browser takes, so it has to track that CSS.
const PORTRAIT_SIZES = "(max-width: 760px) 320px, 300px";

const ABOUT_DESCRIPTION =
  "ShuQi is a photography enthusiast in Kuala Lumpur who travels with her camera in tow, snapping down every story a town has to offer.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about/" },
  openGraph: {
    title: "About · The Wandering Bunny",
    description: ABOUT_DESCRIPTION,
    url: "/about/",
  },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="about-page">
        <div className="about-photo">
          <picture>
            <source
              type="image/webp"
              srcSet="/uploads/about/shuqi-portrait-640.webp 640w, /uploads/about/shuqi-portrait.webp 960w"
              sizes={PORTRAIT_SIZES}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/about/shuqi-portrait.jpg"
              alt="ShuQi"
              width={960}
              height={1200}
              sizes={PORTRAIT_SIZES}
            />
          </picture>
        </div>
        <div className="about-text">
          <p>
            ShuQi is a photography enthusiast living in Kuala Lumpur, Malaysia.
            She sees happiness in the small things most people walk past, and
            loves to travel with her camera in tow, snapping down every story a
            town has to offer.
          </p>
          <p>
            The name Wandering Bunny is her reminder to herself: don&apos;t
            lose direction. Keep a pure heart, keep wandering, and find
            happiness wherever she goes. Live the life she loves, love the
            life she builds.
          </p>
          <p>Hope this gives you a sense of her eye.</p>
        </div>
      </section>
    </SiteShell>
  );
}
