"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-kraft-brown text-warm-white hover:bg-deep-kraft active:scale-[0.98]",
  secondary:
    "bg-transparent text-kraft-brown border border-kraft-brown hover:bg-kraft-tan/40",
  danger: "bg-rust-red text-warm-white hover:brightness-90",
  success: "bg-forest-green text-warm-white hover:brightness-90",
  ghost: "bg-transparent text-charcoal hover:bg-kraft-tan/40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", loading, fullWidth, className = "", children, disabled, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 min-h-[48px] font-medium text-[15px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          variantClasses[variant]
        } ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
