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
import { ShareAppLink } from "@/components/landing/share-app-link";
import { StartSharingLink } from "@/components/landing/start-sharing-link";
import { PairfluxLogo } from "@/components/brand/pairflux-logo";
import { MeshBackground } from "@/components/layout/mesh-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  {
    icon: Zap,
    title: "Instant discovery",
    description: "Peers appear in real time on the same room. No accounts, no setup wizards.",
  },
  {
    icon: Shield,
    title: "Direct WebRTC",
    description: "Files move browser-to-browser over encrypted data channels—not our servers.",
  },
  {
    icon: FileUp,
    title: "Any file type",
    description: "Photos, folders, large videos. Chunked transfer with ACK and resume support.",
  },
  {
    icon: Users,
    title: "Multi-peer",
    description: "Broadcast to everyone in the room or pick one device for targeted sharing.",
  },
];

const stats = [
  { label: "Server storage", value: "0 bytes" },
  { label: "Sign-up required", value: "Never" },
  { label: "Transfer path", value: "P2P only" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <MeshBackground />

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <PairfluxLogo size="md" />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <ShareAppLink className="rounded-xl px-5 shadow-lg shadow-primary/20">
              Open app
              <ArrowRight className="ml-2 h-4 w-4" />
            </ShareAppLink>
          </nav>
        </div>
      </header>

      <main>
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
              Pairflux connects browsers directly with WebRTC. Drop files, text, or links—
              fast, private, and free.
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
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight md:text-3xl">
            Built for speed and privacy
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-card/80"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-primary transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
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
                Launch Pairflux
              </ShareAppLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-10 text-center text-sm text-muted-foreground">
        <p>Pairflux · Open-source P2P file sharing</p>
      </footer>
    </div>
  );
}
