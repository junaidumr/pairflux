import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  centered?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  centered = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto max-w-3xl px-6 pb-12 pt-16 md:pt-20",
        centered && "text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}
