"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartSharingLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Navigates to the share app with scroll reset (pairs with share PageEnter). */
export function StartSharingLink({
  href = "/share",
  className,
  children = "Start sharing",
}: StartSharingLinkProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      size="lg"
      className={className}
      onClick={() => {
        window.scrollTo(0, 0);
        router.push(href);
      }}
    >
      {children}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}
