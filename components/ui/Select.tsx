"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-charcoal">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`min-h-[44px] w-full rounded-lg border border-kraft-tan bg-warm-white px-3.5 text-[16px] text-charcoal focus:border-terracotta focus-visible:outline-none ${
            error ? "border-rust-red" : ""
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        {error && <span className="text-sm text-rust-red">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
