import type { Metadata } from "next";
import {
  FileUp,
  Globe,
  Link2,
  MessageSquare,
  QrCode,
  Radio,
  Shield,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PageHeader } from "@/components/marketing/page-header";
import { ALL_FEATURES } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

const featureIcons = [
  Radio,
  Shield,
  QrCode,
  Users,
  FileUp,
  MessageSquare,
  Link2,
  UserX,
  Globe,
];

export const metadata: Metadata = createPageMetadata({
  title: "Features",
  description:
    "Peer-to-peer file sharing, QR pairing, device discovery, encrypted WebRTC transfers, and more — no account required.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Features"
        title="Everything you need to share privately"
        description="PeerBeam packs enterprise-grade P2P technology into a simple browser experience. No installs, no accounts, no cloud."
      />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_FEATURES.map((feature, i) => {
            const Icon = featureIcons[i] ?? Zap;
            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
