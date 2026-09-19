"use client";

import { getCategoryIcon } from "@/lib/icons";
import type { Category } from "@/app/actions";

export function CategoryTabs({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
          selected === null
            ? "border-brass bg-brass text-case"
            : "border-line text-steel hover:border-steel hover:text-cream"
        }`}
      >
        Todas
      </button>

      {categories.map((c) => {
        const Icon = getCategoryIcon(c.icon);
        const isActive = selected === c.slug;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.slug)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
              isActive
                ? "border-brass bg-brass text-case"
                : "border-line text-steel hover:border-steel hover:text-cream"
            }`}
          >
            <Icon size={15} strokeWidth={2} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
