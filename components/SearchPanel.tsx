"use client";

import { useState, useTransition } from "react";
import { searchDevices, type DeviceResult, type Category } from "@/app/actions";
import { CategoryTabs } from "./CategoryTabs";
import { ResultRow } from "./ResultRow";
import { SuggestDeviceForm } from "./SuggestDeviceForm";

export function SearchPanel({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [results, setResults] = useState<DeviceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runSearch(nextQuery: string, nextCategory: string | null) {
    if (nextQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    startTransition(async () => {
      const data = await searchDevices({
        query: nextQuery,
        categorySlug: nextCategory,
      });
      setResults(data);
      setSearched(true);
    });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    runSearch(value, categorySlug);
  }

  function handleCategoryChange(slug: string | null) {
    setCategorySlug(slug);
    runSearch(query, slug);
  }

  return (
    <div>
      <CategoryTabs
        categories={categories}
        selected={categorySlug}
        onSelect={handleCategoryChange}
      />

      <div className="mt-5">
        <label htmlFor="model-search" className="block text-sm text-steel">
          Marca y modelo, o número de módulo/código
        </label>
        <input
          id="model-search"
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder='p. ej. "F-91W", "Tanita HD-660" o "3159"'
          className="mt-2 w-full rounded-sm border border-line bg-dial px-4 py-3 text-cream placeholder:text-steel/60 outline-none focus:border-brass focus-visible:ring-2 focus-visible:ring-brass/40"
          autoComplete="off"
        />
      </div>

      {/*
        Nota: los resultados con foto (result.image_url) la muestran; los que
        no tienen foto muestran el ícono de categoría en su lugar (ver
        ResultRow.tsx). La búsqueda de texto funciona igual para ambos casos,
        tengan o no foto — no se filtra nada por eso.
      */}
      <div className="mt-6 min-h-[4rem]">
        {isPending && <p className="text-sm text-steel">Buscando…</p>}

        {!isPending && searched && results.length > 0 && (
          <ul>
            {results.map((r) => (
              <ResultRow key={r.id} result={r} />
            ))}
          </ul>
        )}

        {!isPending && searched && results.length === 0 && (
          <div className="rounded-sm border border-line bg-dial p-5">
            <p className="text-sm text-cream">
              No encontramos ese modelo todavía.
            </p>
            <p className="mt-1 text-sm text-steel">
              Ayúdanos a agregarlo — otras personas se beneficiarán.
            </p>
            <SuggestDeviceForm
              prefillModel={query}
              categories={categories}
              defaultCategorySlug={categorySlug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
