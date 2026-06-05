import type { Metadata } from "next";
import { Code2, Heart, Lock, Radio } from "lucide-react";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PageHeader } from "@/components/marketing/page-header";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Learn about PeerBeam — a privacy-first, peer-to-peer file sharing app built with WebRTC and modern web technology.",
  path: "/about",
});

const techStack = [
  { name: "Next.js 15", role: "Frontend framework" },
  { name: "WebRTC", role: "Peer-to-peer data channels" },
  { name: "Socket.io", role: "Signaling & discovery" },
  { name: "Tailwind CSS", role: "UI styling" },
  { name: "Shadcn UI", role: "Component library" },
  { name: "TypeScript", role: "Type-safe codebase" },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="About"
        title={`What is ${SITE_NAME}?`}
        description={`${SITE_NAME} is a browser-based file sharing app inspired by AirDrop, PairDrop, and Snapdrop. It lets you transfer files, text, and links directly between devices — without uploading anything to the cloud.`}
      />

      <section className="mx-auto max-w-3xl space-y-16 px-6 pb-24">
        <article className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Heart className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Mission</h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            We believe file sharing should be instant, private, and accessible to everyone.
            {SITE_NAME} removes the friction of accounts, app installs, and cloud intermediaries.
            Your data stays between your devices — where it belongs.
          </p>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Radio className="h-5 w-5" />
            <h2 className="text-xl font-semibold">How {SITE_NAME} works</h2>
          </div>
          <ol className="space-y-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">1. Discovery</strong> — Devices join a
              shared room via a lightweight signaling server. You see nearby peers in real time.
            </li>
            <li>
              <strong className="text-foreground">2. Pairing</strong> — A one-time 3-digit code
              or QR scan establishes trust between two devices before any data is exchanged.
            </li>
            <li>
              <strong className="text-foreground">3. Transfer</strong> — WebRTC opens an
              encrypted data channel. Files are chunked, acknowledged, and streamed directly
              browser-to-browser.
            </li>
          </ol>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Why privacy matters</h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Traditional file sharing routes your data through third-party servers. That means
            storage costs, privacy risks, and upload wait times. {SITE_NAME} uses a
            peer-to-peer architecture: the server facilitates introductions, but your files
            never leave your devices. No tracking, no profiling, no data retention.
          </p>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Code2 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Technology stack</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {techStack.map((tech) => (
              <li
                key={tech.name}
                className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3"
              >
                <p className="font-medium">{tech.name}</p>
                <p className="text-xs text-muted-foreground">{tech.role}</p>
              </li>
            ))}
          </ul>
        </article>

        <div className="text-center">
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/share">Try {SITE_NAME} now</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
