import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl",
        "border border-border/60 bg-card/70 shadow-2xl shadow-black/5 backdrop-blur-2xl",
        "dark:bg-card/50 dark:shadow-black/30",
        className
      )}
    >
      {children}
    </div>
  );
}
