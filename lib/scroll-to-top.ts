export interface ScrollToTopOptions {
  smooth?: boolean;
}

/** Scroll window and any in-app scroll containers to the top. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function scrollPageToTop({ smooth = true }: ScrollToTopOptions = {}): void {
  if (typeof window === "undefined") return;

  const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? "smooth" : "auto";

  window.scrollTo({ top: 0, left: 0, behavior });
  document.documentElement.scrollTo({ top: 0, left: 0, behavior });
  document.body.scrollTo({ top: 0, left: 0, behavior });

  document.querySelectorAll("[data-radix-scroll-area-viewport], [data-scroll-root]").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTo({ top: 0, left: 0, behavior });
    }
  });
}

export function disableScrollRestoration(): void {
  if (typeof window === "undefined") return;
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
}
