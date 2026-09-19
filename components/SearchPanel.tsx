"use client";

import { useState, useTransition } from "react";
import { searchDevices, type DeviceResult, type Category } from "@/app/actions";
import { CategoryTabs } from "./CategoryTabs";
import { ResultRow } from "./ResultRow";
import { SuggestDeviceForm } from "./SuggestDeviceForm";
import { PhotoScanButton } from "./PhotoScanButton";

export function SearchPanel({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [results, setResults] = useState<DeviceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [detectedCodes, setDetectedCodes] = useState<string[]>([]);

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

  function handleCodesDetected(codes: string[]) {
    setDetectedCodes(codes);
    // Prueba automáticamente con el candidato más probable (el primero,
    // ya viene priorizado en PhotoScanButton). Si no es el correcto, el
    // usuario puede tocar cualquiera de los otros chips de abajo.
    handleQueryChange(codes[0]);
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
        <div className="mt-2 flex gap-2">
          <input
            id="model-search"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder='p. ej. "F-91W", "Tanita HD-660" o "3159"'
            className="w-full rounded-sm border border-line bg-dial px-4 py-3 text-cream placeholder:text-steel/60 outline-none focus:border-brass focus-visible:ring-2 focus-visible:ring-brass/40"
            autoComplete="off"
          />
          <PhotoScanButton onCodesDetected={handleCodesDetected} />
        </div>

        {detectedCodes.length > 1 && (
          <div className="mt-3">
            <p className="text-xs text-steel">
              Detectamos varios códigos en la foto — toca el correcto si el
              primero no era:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {detectedCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleQueryChange(code)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                    query === code
                      ? "border-brass bg-brass text-case"
                      : "border-line text-steel hover:border-steel hover:text-cream"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-2 text-xs text-steel">
          La foto se procesa en tu propio navegador y nunca se guarda ni se
          sube a ningún servidor — solo se usa para leer el texto grabado.
        </p>
      </div>

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
