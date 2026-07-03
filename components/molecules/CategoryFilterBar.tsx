"use client";

import type { Category } from "@/types/poster";

export function CategoryFilterBar({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string | null;
  onChange: (categoryId: string | null) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-1">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          active === null
            ? "bg-kraft-brown text-warm-white"
            : "bg-warm-white text-charcoal border border-kraft-tan"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === cat.id
              ? "bg-kraft-brown text-warm-white"
              : "bg-warm-white text-charcoal border border-kraft-tan"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
