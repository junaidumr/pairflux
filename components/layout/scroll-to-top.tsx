"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { disableScrollRestoration, scrollPageToTop } from "@/lib/scroll-to-top";

/**
 * Resets scroll position on every route change.
 * Prevents the browser from restoring a previous scroll offset.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    disableScrollRestoration();
  }, []);

  useEffect(() => {
    const isRouteChange = previousPath.current !== null && previousPath.current !== pathname;
    previousPath.current = pathname;

    const smooth = isRouteChange;

    const scroll = () => scrollPageToTop({ smooth });

    // Run after paint so Next.js layout / Suspense content is mounted.
    requestAnimationFrame(() => {
      requestAnimationFrame(scroll);
    });

    const t1 = window.setTimeout(scroll, 0);
    const t2 = window.setTimeout(scroll, 100);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
