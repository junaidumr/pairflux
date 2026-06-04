"use client";

import { Suspense } from "react";
import { ShareClient } from "@/app/share/share-client";

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading peer-beam…
        </div>
      }
    >
      <ShareClient />
    </Suspense>
  );
}
