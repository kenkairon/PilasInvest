"use client";

import { useState } from "react";
import { suggestDevice, type Category } from "@/app/actions";
import { getCategoryIcon } from "@/lib/icons";
import { PhotoUploadField } from "./PhotoUploadField";

export function SuggestDeviceForm({
  prefillModel,
  categories,
  defaultCategorySlug,
}: {
  prefillModel: string;
  categories: Category[];
  defaultCategorySlug?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [categorySlug, setCategorySlug] = useState(defaultCategorySlug ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrl2, setImageUrl2] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(formData: FormData) {
    setStatus("sending");

    const categoryName =
      categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug;

    const result = await suggestDevice({
      categoryName,
      brandName: String(formData.get("brandName") ?? ""),
      modelName: String(formData.get("modelName") ?? ""),
      modelCode: String(formData.get("modelCode") ?? ""),
      batteryCodeReported: String(formData.get("batteryCode") ?? ""),
      email: String(formData.get("email") ?? ""),
      imageUrl: imageUrl ?? undefined,
      imageUrl2: imageUrl2 ?? undefined,
    });

    setStatus(result.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <p className="mt-3 text-sm text-brass">
        Gracias — revisaremos tu propuesta y la añadiremos a la base de datos.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-brass underline underline-offset-2"
      >
        Agregar este dispositivo
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3">
      <div>
        <p className="mb-2 text-xs text-steel">¿Qué tipo de dispositivo es?</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const isActive = categorySlug === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategorySlug(c.slug)}
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

      <div className="grid grid-cols-2 gap-3">
        <input
          name="brandName"
          required
          placeholder="Marca *"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          name="modelName"
          required
          defaultValue={prefillModel}
          placeholder="Modelo *"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          name="modelCode"
          placeholder="Código/módulo (opcional)"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          name="batteryCode"
          placeholder="Código de pila, si lo conoces"
          className="rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email (opcional, para avisarte)"
        className="w-full rounded-sm border border-line bg-case px-3 py-2 text-sm text-cream outline-none focus:border-brass"
      />

      <div className="space-y-2">
        <PhotoUploadField label="Foto 1 (opcional)" onUploaded={setImageUrl} />
        <PhotoUploadField label="Foto 2 (opcional)" onUploaded={setImageUrl2} />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-case disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Enviar sugerencia"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400">
          Algo falló al enviar. Inténtalo de nuevo.
        </p>
      )}
    </form>
  );
}
