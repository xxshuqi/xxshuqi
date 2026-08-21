import SiteShell from "@/components/layout/SiteShell";

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="about-page">
        <div className="about-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/about/shuqi-portrait.jpg"
            alt="ShuQi"
            width={960}
            height={1200}
          />
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
