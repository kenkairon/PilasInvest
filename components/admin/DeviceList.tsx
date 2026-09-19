"use client";

import { useMemo, useState } from "react";
import { DeviceRow, type Device } from "./DeviceRow";

type Option = { id: number; name: string };
type BatteryOption = { id: number; code: string };
type CategoryOption = { id: number; name: string; slug: string; icon: string };

export function DeviceList({
  devices,
  brands,
  batteries,
  categories,
}: {
  devices: Device[];
  brands: Option[];
  batteries: BatteryOption[];
  categories: CategoryOption[];
}) {
  const [items, setItems] = useState(devices);
  const [brandOptions, setBrandOptions] = useState(brands);
  const [batteryOptions, setBatteryOptions] = useState(batteries);
  const [query, setQuery] = useState("");

  function handleUpdated(updated: Device) {
    setItems((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  function handleDeleted(id: number) {
    setItems((prev) => prev.filter((d) => d.id !== id));
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

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (d) =>
        d.model_name.toLowerCase().includes(q) ||
        d.model_code?.toLowerCase().includes(q) ||
        d.brand?.name.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrar por marca, modelo o código…"
        className="w-full rounded-sm border border-line bg-dial px-4 py-2.5 text-sm text-cream outline-none focus:border-brass"
      />

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-sm border border-line bg-dial p-5 text-steel">
          No hay dispositivos que coincidan.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {filtered.map((d) => (
            <DeviceRow
              key={d.id}
              device={d}
              brands={brandOptions}
              batteries={batteryOptions}
              categories={categories}
              onUpdated={handleUpdated}
              onDeleted={() => handleDeleted(d.id)}
              onBrandCreated={handleBrandCreated}
              onBatteryCreated={handleBatteryCreated}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
