"use client";

import Nav from "./Nav";
import Footer from "./Footer";
import VerticalText from "./VerticalText";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <VerticalText />
      <main style={{ minHeight: "100vh" }}>{children}</main>
      <Footer />
    </>
  );
}
