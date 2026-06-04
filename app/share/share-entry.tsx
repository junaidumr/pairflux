"use client";

import dynamic from "next/dynamic";

const ShareClient = dynamic(
  () => import("@/app/share/share-client").then((m) => m.ShareClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading peer-beam…
      </div>
    ),
  }
);

export function ShareEntry() {
  return <ShareClient />;
}
