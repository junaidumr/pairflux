"use client";

import { PageEnter } from "@/components/layout/page-enter";

export default function ShareTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageEnter fromTop className="min-h-screen w-full flex-1">
      {children}
    </PageEnter>
  );
}
