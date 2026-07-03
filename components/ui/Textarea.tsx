"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-charcoal">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={`min-h-[88px] w-full resize-y rounded-lg border border-kraft-tan bg-warm-white px-3.5 py-2.5 text-[16px] text-charcoal placeholder:text-warm-gray focus:border-terracotta focus-visible:outline-none ${
            error ? "border-rust-red" : ""
          } ${className}`}
          {...rest}
        />
        {error && <span className="text-sm text-rust-red">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
