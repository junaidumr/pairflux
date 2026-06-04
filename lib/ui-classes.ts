import { cn } from "@/lib/utils";

export const glassPanel = cn(
  "rounded-2xl border border-white/10 bg-card/60 shadow-xl shadow-black/5 backdrop-blur-xl",
  "dark:border-white/8 dark:bg-card/40 dark:shadow-black/40"
);

export const panelHeader = "text-sm font-semibold tracking-tight text-foreground";

export const subtleText = "text-sm text-muted-foreground";

export const meshPage = cn(
  "relative min-h-screen overflow-hidden",
  "bg-background"
);

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
