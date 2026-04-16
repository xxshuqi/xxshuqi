"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";
import VerticalText from "./VerticalText";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Nav />
      <VerticalText />
      <main style={{ minHeight: "100vh" }}>{children}</main>
      <Footer />
    </>
  );
}
