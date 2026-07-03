"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-charcoal">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`min-h-[44px] w-full rounded-lg border border-kraft-tan bg-warm-white px-3.5 text-[16px] text-charcoal placeholder:text-warm-gray focus:border-terracotta focus-visible:outline-none ${
            error ? "border-rust-red" : ""
          } ${className}`}
          {...rest}
        />
        {error && <span className="text-sm text-rust-red">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
