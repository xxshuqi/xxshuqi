import { getSettings } from "@/lib/settings";
import SectionLabel from "@/components/ui/SectionLabel";

export const revalidate = 60;

export default function AboutPage() {
  const { about } = getSettings();
  const paragraphs = about.bio.split(/\n\n+/).filter(Boolean);

  return (
    <div style={{ paddingTop: "52px" }}>
      <section className="section-about" style={{ padding: "80px 80px 120px" }}>
        <SectionLabel number="06" label="About" />

        {/* Two-column layout: photo left, content right */}
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "80px", alignItems: "start", marginTop: "0" }}>

          {/* Left: portrait photo */}
          <div className="about-photo-col" style={{ position: "sticky", top: "80px" }}>
            <div style={{ overflow: "hidden", aspectRatio: "2 / 3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-photo.jpg"
                alt="ShuQi at Nyhavn, Copenhagen"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
              />
            </div>
          </div>

          {/* Right: heading, bio, gear */}
          <div>
            <h1
              className="about-heading"
              style={{
                fontFamily: "DM Sans, system-ui, sans-serif",
                fontSize: "52px",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "24px",
              }}
            >
              {about.heading}
            </h1>

            <div
              style={{
                fontFamily: "DM Sans, system-ui, sans-serif",
                fontSize: "19px",
                fontWeight: 300,
                lineHeight: 1.85,
                color: "var(--text-mid)",
              }}
            >
              {paragraphs.map((para, i) => (
                <p key={i} style={{ marginBottom: "1.5em" }}>
                  {para}
                </p>
              ))}
              <p style={{ textAlign: "right", marginTop: "2em", color: "var(--text-light)" }}>
                ShuQi, The Wandering Bunny 🐰
              </p>
            </div>

            {about.gear.length > 0 && (
              <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid var(--border)" }}>
                <h2
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                    marginBottom: "24px",
                  }}
                >
                  Gear
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {about.gear.map(({ label, value }) => (
                    <div
                      key={label}
                      style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "16px" }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "var(--text-faint)",
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-mid)", fontWeight: 300 }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
