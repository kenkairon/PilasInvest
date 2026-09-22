"use client";

import { useState, useTransition } from "react";
import {
  approveSuggestion,
  rejectSuggestion,
  createBrand,
  createBatteryType,
} from "@/app/admin/actions";
import { getCategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/format";

export type Suggestion = {
  id: number;
  category_name: string | null;
  brand_name: string;
  model_name: string;
  model_code: string | null;
  battery_code_reported: string | null;
  image_url: string | null;
  image_url_2: string | null;
  whatsapp: string | null;
  created_at: string;
};

type Option = { id: number; name: string };
type BatteryOption = { id: number; code: string };
type CategoryOption = { id: number; name: string; slug: string; icon: string };

export function SuggestionRow({
  suggestion,
  brands,
  batteries,
  categories,
  onResolved,
  onBrandCreated,
  onBatteryCreated,
}: {
  suggestion: Suggestion;
  brands: Option[];
  batteries: BatteryOption[];
  categories: CategoryOption[];
  onResolved: () => void;
  onBrandCreated: (brand: Option) => void;
  onBatteryCreated: (battery: BatteryOption) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Intenta pre-seleccionar la categoría que el usuario escribió, si coincide
  const guessedCategory = categories.find(
    (c) => c.name.toLowerCase() === (suggestion.category_name ?? "").toLowerCase()
  );
  const [categoryId, setCategoryId] = useState(
    guessedCategory ? String(guessedCategory.id) : ""
  );

  const [brandId, setBrandId] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState(suggestion.brand_name);

  const [modelName, setModelName] = useState(suggestion.model_name);
  const [modelCode, setModelCode] = useState(suggestion.model_code ?? "");

  const [batteryTypeId, setBatteryTypeId] = useState("");
  const [addingBattery, setAddingBattery] = useState(false);
  const [newBatteryCode, setNewBatteryCode] = useState(
    suggestion.battery_code_reported ?? ""
  );
  const [newBatteryVoltage, setNewBatteryVoltage] = useState("1.55");
  const [newBatteryDiameter, setNewBatteryDiameter] = useState("");
  const [newBatteryHeight, setNewBatteryHeight] = useState("");

  const [isSolar, setIsSolar] = useState(false);
  const [noBattery, setNoBattery] = useState(false);

  function handleCreateBrand() {
    if (!newBrandName.trim()) return;
    startTransition(async () => {
      try {
        const brand = await createBrand(newBrandName);
        onBrandCreated(brand);
        setBrandId(String(brand.id));
        setAddingBrand(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear la marca.");
      }
    });
  }

  function handleCreateBattery() {
    if (!newBatteryCode.trim()) return;
    startTransition(async () => {
      try {
        const battery = await createBatteryType({
          code: newBatteryCode,
          voltage: newBatteryVoltage ? Number(newBatteryVoltage) : undefined,
          diameterMm: newBatteryDiameter ? Number(newBatteryDiameter) : undefined,
          heightMm: newBatteryHeight ? Number(newBatteryHeight) : undefined,
        });
        onBatteryCreated(battery);
        setBatteryTypeId(String(battery.id));
        setAddingBattery(false);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo crear el tipo de pila."
        );
      }
    });
  }

  function handleApprove() {
    if (!categoryId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!brandId) {
      setError("Selecciona (o crea) una marca.");
      return;
    }
    if (!noBattery && !batteryTypeId) {
      setError("Selecciona el tipo de pila, o marca 'No lleva pila'.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await approveSuggestion({
          suggestionId: suggestion.id,
          categoryId: Number(categoryId),
          brandId: Number(brandId),
          modelName,
          modelCode,
          imageUrl: suggestion.image_url,
          imageUrl2: suggestion.image_url_2,
          batteryTypeId: noBattery ? null : Number(batteryTypeId),
          isSolar,
          noBattery,
        });
        onResolved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al aprobar.");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectSuggestion(suggestion.id);
        onResolved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al rechazar.");
      }
    });
  }

  return (
    <li className="rounded-sm border border-line bg-dial p-4">
      <div className="flex items-start gap-3">
        {(suggestion.image_url || suggestion.image_url_2) && (
          <div className="flex shrink-0 gap-1.5">
            {suggestion.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={suggestion.image_url}
                alt={suggestion.model_name}
                className="h-12 w-12 rounded-sm border border-line object-cover"
              />
            )}
            {suggestion.image_url_2 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={suggestion.image_url_2}
                alt={`${suggestion.model_name} (foto 2)`}
                className="h-12 w-12 rounded-sm border border-line object-cover"
              />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-medium text-cream">
              {suggestion.category_name ? `${suggestion.category_name} · ` : ""}
              {suggestion.brand_name} — {suggestion.model_name}
            </p>
            <p className="shrink-0 font-mono text-xs text-steel">
              {formatDate(suggestion.created_at)}
            </p>
          </div>
          <p className="mt-1 text-sm text-steel">
            Código: {suggestion.model_code || "—"} · Pila reportada por el
            usuario: {suggestion.battery_code_reported || "—"}
          </p>
          {suggestion.whatsapp && (
            <a
              href={`https://wa.me/${suggestion.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-brass hover:underline"
            >
              📱 {suggestion.whatsapp} — contactar por WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Categoría */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs text-steel">Categoría</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const isActive = categoryId === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(String(c.id))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "border-brass bg-brass text-case"
                    : "border-line text-steel hover:border-steel hover:text-cream"
                }`}
              >
                <Icon size={13} />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {!addingBrand ? (
          <div className="flex gap-2">
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
            >
              <option value="">Marca…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingBrand(true)}
              className="shrink-0 rounded-sm border border-line px-2 text-xs text-steel hover:text-cream"
              title="Crear marca nueva"
            >
              + nueva
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nombre de la marca"
              className="w-full rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
            />
            <button
              type="button"
              onClick={handleCreateBrand}
              disabled={isPending}
              className="shrink-0 rounded-sm bg-brass px-2 text-xs font-medium text-case disabled:opacity-60"
            >
              Crear
            </button>
          </div>
        )}

        {!addingBattery ? (
          <div className="flex gap-2">
            <select
              value={batteryTypeId}
              onChange={(e) => setBatteryTypeId(e.target.value)}
              disabled={noBattery}
              className="w-full rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass disabled:opacity-50"
            >
              <option value="">Tipo de pila…</option>
              {batteries.map((b) => (
                <option key={b.id} value={b.id} className="font-mono">
                  {b.code}
                </option>
              ))}
            </select>
            {!noBattery && (
              <button
                type="button"
                onClick={() => setAddingBattery(true)}
                className="shrink-0 rounded-sm border border-line px-2 text-xs text-steel hover:text-cream"
                title="Crear tipo de pila nuevo"
              >
                + nueva
              </button>
            )}
          </div>
        ) : (
          <div className="col-span-1 space-y-2 rounded-sm border border-line p-2">
            <div className="flex gap-2">
              <input
                value={newBatteryCode}
                onChange={(e) => setNewBatteryCode(e.target.value)}
                placeholder="Código (p. ej. SR927W)"
                className="w-full rounded-sm border border-line bg-case px-2 py-1.5 text-sm font-mono text-cream outline-none focus:border-brass"
              />
              <button
                type="button"
                onClick={handleCreateBattery}
                disabled={isPending}
                className="shrink-0 rounded-sm bg-brass px-2 text-xs font-medium text-case disabled:opacity-60"
              >
                Crear
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={newBatteryVoltage}
                onChange={(e) => setNewBatteryVoltage(e.target.value)}
                placeholder="Voltios"
                className="w-1/3 rounded-sm border border-line bg-case px-2 py-1.5 text-xs text-cream outline-none focus:border-brass"
              />
              <input
                value={newBatteryDiameter}
                onChange={(e) => setNewBatteryDiameter(e.target.value)}
                placeholder="Diám. mm"
                className="w-1/3 rounded-sm border border-line bg-case px-2 py-1.5 text-xs text-cream outline-none focus:border-brass"
              />
              <input
                value={newBatteryHeight}
                onChange={(e) => setNewBatteryHeight(e.target.value)}
                placeholder="Alto mm"
                className="w-1/3 rounded-sm border border-line bg-case px-2 py-1.5 text-xs text-cream outline-none focus:border-brass"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddingBattery(false)}
              className="text-xs text-steel underline underline-offset-2"
            >
              cancelar
            </button>
          </div>
        )}

        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Nombre del modelo"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          value={modelCode}
          onChange={(e) => setModelCode(e.target.value)}
          placeholder="Código/módulo (opcional)"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
      </div>

      <div className="mt-3 flex gap-4 text-sm text-steel">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSolar}
            onChange={(e) => setIsSolar(e.target.checked)}
          />
          Celda solar
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={noBattery}
            onChange={(e) => setNoBattery(e.target.checked)}
          />
          No lleva pila (mecánico / a cuerda)
        </label>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-case disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Aprobar y publicar"}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="rounded-sm border border-line px-4 py-2 text-sm text-steel hover:text-cream disabled:opacity-60"
        >
          Rechazar
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </li>
  );
}
