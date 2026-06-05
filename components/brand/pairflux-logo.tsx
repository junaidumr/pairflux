import { Radio } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PairfluxLogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: "h-7 w-7", iconInner: "h-3.5 w-3.5", text: "text-sm" },
  md: { icon: "h-9 w-9", iconInner: "h-4 w-4", text: "text-base" },
  lg: { icon: "h-11 w-11", iconInner: "h-5 w-5", text: "text-lg" },
};

export function PairfluxLogo({
  href = "/",
  className,
  showText = true,
  size = "md",
}: PairfluxLogoProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105",
          s.icon
        )}
      >
        <Radio className={cn(s.iconInner, "animate-pulse")} strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {showText && (
        <span className={cn("font-semibold tracking-tight", s.text)}>
          Peer<span className="text-primary">Beam</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="outline-none">
        {content}
      </Link>
    );
  }
  return content;
}
