import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary font-semibold shadow-[0_10px_30px_-10px_rgba(192,193,255,0.3)] hover:opacity-90",
  secondary:
    "bg-surface-bright border border-outline-variant/50 text-on-surface hover:bg-surface-variant",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
  outline: "bg-transparent border border-outline text-primary hover:bg-primary/10",
  danger: "bg-error text-on-error font-semibold hover:opacity-90",
  icon: "bg-transparent text-on-surface-variant hover:bg-surface-bright rounded-lg",
};

const sizeClasses: Record<Size, string> = {
  sm: "py-2 px-md text-sm",
  md: "py-3 px-xl text-body-md",
  lg: "py-4 px-2xl text-body-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, icon, disabled, children, ...props },
    ref
  ) => {
    const isIconOnly = variant === "icon";
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-sm rounded-lg font-body-md",
          "transition-all duration-200 active:scale-[0.98]",
          "disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
          "whitespace-nowrap",
          !isIconOnly && sizeClasses[size],
          isIconOnly && "p-2.5",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <Icon name="spinner" spin className="w-4 h-4" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
