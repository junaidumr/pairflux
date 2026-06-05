import Link from "next/link";
import { PairfluxLogo } from "@/components/brand/pairflux-logo";
import { FOOTER_LINKS, NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <PairfluxLogo size="sm" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {SITE_TAGLINE}. Private, fast, and free — powered by WebRTC.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide">Quick Links</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.filter((l) => l.href !== "/").map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/share"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Open App
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide">Legal</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} {SITE_NAME}. All Rights Reserved.</p>
          <p className="text-xs">Peer-to-peer only · Zero server storage</p>
        </div>
      </div>
    </footer>
  );
}
