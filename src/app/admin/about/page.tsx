import { getSettings } from "@/lib/settings";
import AboutEditor from "@/components/admin/AboutEditor";

export default function AdminAboutPage() {
  const { about } = getSettings();

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 400,
          marginBottom: "8px",
          fontFamily: "Libre Caslon Display, Georgia, serif",
        }}
      >
        About Me
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        Edit the content shown on the public About page
      </p>

      <AboutEditor initial={about} />
    </div>
  );
}
