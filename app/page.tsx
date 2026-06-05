import {
  ArrowRight,
  FileUp,
  Lock,
  Radio,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ShareAppLink } from "@/components/landing/share-app-link";
import { StartSharingLink } from "@/components/landing/start-sharing-link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Button } from "@/components/ui/button";
import {
  FAQ_ITEMS,
  HOME_FEATURES,
  HOW_IT_WORKS,
  SITE_NAME,
} from "@/lib/site";

const featureIcons = [Zap, Shield, FileUp, Users];

const stats = [
  { label: "Server storage", value: "0 bytes" },
  { label: "Sign-up required", value: "Never" },
  { label: "Transfer path", value: "P2P only" },
];

export default function LandingPage() {
  const faqPreview = FAQ_ITEMS.slice(0, 3);

  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Pure peer-to-peer · No cloud uploads
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl md:leading-[1.08]">
            Share anything to nearby devices,{" "}
            <span className="text-gradient">like AirDrop for the web</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {SITE_NAME} connects browsers directly with WebRTC. Drop files, text, or
            links— fast, private, and free.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <StartSharingLink className="h-12 rounded-xl px-8 text-base glow-primary" />
            <ShareAppLink
              variant="outline"
              size="lg"
              className="h-12 rounded-xl px-8"
              href="/share?room=demo"
            >
              Try demo room
            </ShareAppLink>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl md:max-w-none md:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold tracking-tight md:text-2xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Built for speed and privacy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Everything you need for instant, private sharing between devices.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_FEATURES.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-card/80"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/features">
              Explore all features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Three steps from open to share — no install, no account.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl"
            >
              <span className="text-4xl font-bold text-primary/20">{step.step}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-8 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <Lock className="h-5 w-5" />
                <span className="text-sm font-medium">Security first</span>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                Signaling only. Your files never touch our disk.
              </h3>
              <p className="mt-3 text-muted-foreground">
                Socket.io handles discovery and WebRTC handshake. Transfers use SCTP with
                per-chunk acknowledgements, backpressure, and optional TURN for tough networks.
              </p>
            </div>
            <ShareAppLink size="lg" className="shrink-0 rounded-xl">
              <Radio className="mr-2 h-4 w-4" />
              Launch {SITE_NAME}
            </ShareAppLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 px-6 backdrop-blur-xl">
          <FaqAccordion items={faqPreview} />
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="link">
            <Link href="/faq">View all questions →</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-500/10 p-10 text-center backdrop-blur-xl md:p-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
            Ready to share?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Open {SITE_NAME} on two devices in the same room and start transferring files
            in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <StartSharingLink className="h-12 rounded-xl px-8 text-base glow-primary" />
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-8">
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
