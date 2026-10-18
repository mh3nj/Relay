import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "bg-surface-container rounded-xl border border-outline-variant/30",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardEyebrow({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
