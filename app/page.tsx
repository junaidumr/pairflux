import { ArrowRight, Lock, Shield, Wifi, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Open peer-beam",
    description: "No signup. Open the site on any device on the same room.",
    icon: Zap,
  },
  {
    title: "Discover peers",
    description: "Nearby browsers appear instantly via secure signaling.",
    icon: Wifi,
  },
  {
    title: "Send directly",
    description: "Files travel browser-to-browser over encrypted WebRTC channels.",
    icon: Shield,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          peer-beam
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/share">Start Sharing</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 text-center md:pt-24">
          <p className="mb-4 inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            Pure P2P · No accounts · No server storage
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Share files instantly,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              browser to browser
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            peer-beam is a modern AirDrop-style experience for the web. Drop files,
            text, or links to nearby devices with end-to-end WebRTC — nothing touches
            our servers.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/share">
                Start Sharing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="border-border/60 bg-card/80">
                <CardHeader>
                  <step.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Card className="border-primary/20 bg-card/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Security by design</CardTitle>
              </div>
              <CardDescription className="text-base leading-relaxed">
                Files never upload to our infrastructure. Socket.io handles discovery and
                WebRTC handshake only. Transfers use encrypted data channels with chunked,
                acknowledged delivery and optional TURN for restrictive networks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li>· DTLS-SRTP / SCTP encryption (WebRTC native)</li>
                <li>· Temporary session IDs, no accounts</li>
                <li>· Rate-limited signaling server</li>
                <li>· Auto-expire inactive peers</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        peer-beam · Open-source P2P file sharing
      </footer>
    </div>
  );
}
