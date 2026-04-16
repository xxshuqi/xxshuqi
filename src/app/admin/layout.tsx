import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/about", label: "About Me" },
  { href: "/admin/engagement", label: "Engagement" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  // Login page renders without the sidebar
  if (!authed) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "DM Sans, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#f8f8f8",
          borderRight: "1px solid #e8e8e8",
          padding: "32px 20px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Link
          href="/admin"
          style={{
            fontFamily: "Libre Caslon Display, Georgia, serif",
            fontSize: "20px",
            color: "#111",
            textDecoration: "none",
            marginBottom: "4px",
            display: "block",
          }}
        >
          Bunnies.
        </Link>
        <p style={{ fontSize: "11px", color: "#999", letterSpacing: "0.15em", marginBottom: "40px" }}>
          ADMIN
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "13px",
                color: "#555",
                textDecoration: "none",
                display: "block",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "#999",
              textDecoration: "none",
              display: "block",
              marginBottom: "8px",
            }}
          >
            ← View site
          </Link>
          <form action="/api/auth" method="DELETE">
            <button
              formAction="/api/auth"
              style={{
                background: "none",
                border: "none",
                fontSize: "12px",
                color: "#999",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "40px", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
