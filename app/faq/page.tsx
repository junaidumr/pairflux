import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PageHeader } from "@/components/marketing/page-header";
import { Button } from "@/components/ui/button";
import { FAQ_ITEMS } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about PeerBeam — pricing, security, mobile support, pairing, and browser compatibility.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Everything you need to know about using PeerBeam safely and effectively."
      />

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-border/60 bg-card/50 px-6 backdrop-blur-xl">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <p className="text-muted-foreground">Still have questions?</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href="/contact">Contact us</Link>
        </Button>
      </section>
    </MarketingShell>
  );
}
