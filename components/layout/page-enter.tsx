"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface PageEnterProps {
  children: React.ReactNode;
  className?: string;
  /** Slide down from above the viewport (default). */
  fromTop?: boolean;
}

/**
 * Full-page enter transition — slides DOWN from the top with a soft fade.
 * Used by app/share/template.tsx when navigating from the landing page.
 */
export function PageEnter({ children, className, fromTop = true }: PageEnterProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (reduced) {
    return <div className={cn("w-full bg-background", className)}>{children}</div>;
  }

  const initialY = fromTop ? -40 : 40;

  return (
    <motion.div
      className={cn("w-full bg-background", className)}
      initial={{ opacity: 0, y: initialY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: EASE_OUT,
      }}
    >
      {children}
    </motion.div>
  );
}
