"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareAppLinkProps {
  href?: string;
  className?: string;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

/** Client navigation to /share — scroll reset handled globally on route change. */
export function ShareAppLink({
  href = "/share",
  className,
  children,
  variant,
  size,
}: ShareAppLinkProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );
}
