"use client";

import { PairfluxLogo } from "@/components/brand/pairflux-logo";
import { MeshBackground } from "@/components/layout/mesh-background";

export function LoadingScreen({ message = "Connecting to the mesh…" }: { message?: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6">
      <MeshBackground />
      <PairfluxLogo href={undefined} size="lg" />
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
