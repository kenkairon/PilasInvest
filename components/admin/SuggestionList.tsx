"use client";

import { useState } from "react";
import { SuggestionRow, type Suggestion } from "./SuggestionRow";

type Option = { id: number; name: string };
type BatteryOption = { id: number; code: string };
type CategoryOption = { id: number; name: string; slug: string; icon: string };

export function SuggestionList({
  suggestions,
  brands,
  batteries,
  categories,
}: {
  suggestions: Suggestion[];
  brands: Option[];
  batteries: BatteryOption[];
  categories: CategoryOption[];
}) {
  const [items, setItems] = useState(suggestions);
  const [brandOptions, setBrandOptions] = useState(brands);
  const [batteryOptions, setBatteryOptions] = useState(batteries);

  function handleResolved(id: number) {
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  function handleBrandCreated(brand: Option) {
    setBrandOptions((prev) =>
      [...prev, brand].sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  function handleBatteryCreated(battery: BatteryOption) {
    setBatteryOptions((prev) =>
      [...prev, battery].sort((a, b) => a.code.localeCompare(b.code))
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-sm border border-line bg-dial p-5 text-steel">
        No hay sugerencias pendientes por ahora.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((s) => (
        <SuggestionRow
          key={s.id}
          suggestion={s}
          brands={brandOptions}
          batteries={batteryOptions}
          categories={categories}
          onResolved={() => handleResolved(s.id)}
          onBrandCreated={handleBrandCreated}
          onBatteryCreated={handleBatteryCreated}
        />
      ))}
    </ul>
  );
}
