"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portfolio/");
  }, [router]);

  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/portfolio/" />
      <noscript>
        <a href="/portfolio/">Continue to Portfolio</a>
      </noscript>
    </>
  );
}
