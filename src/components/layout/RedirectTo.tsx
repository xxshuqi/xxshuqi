"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side redirect for a static export. There is no server here to issue a
 * 301, so this is a meta refresh for crawlers and no-JS visitors plus a
 * router.replace for everyone else. Pair it with a canonical on the page so
 * search engines consolidate onto the destination rather than treating both
 * URLs as separate pages.
 */
export default function RedirectTo({ to, label }: { to: string; label: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <noscript>
        <a href={to}>{label}</a>
      </noscript>
    </>
  );
}
