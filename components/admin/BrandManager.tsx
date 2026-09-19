"use client";

import { useState, useTransition } from "react";
import { createBrand, updateBrand, deleteBrand } from "@/app/admin/actions";

type Brand = { id: number; name: string; slug: string; deviceCount: number };

export function BrandManager({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const brand = await createBrand(newName);
        setBrands((prev) =>
          [...prev, { ...brand, slug: "", deviceCount: 0 }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setNewName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear la marca.");
      }
    });
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-cream">Marcas</h2>

      <div className="mt-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva marca (p. ej. Xiaomi)"
          className="w-full rounded-sm border border-line bg-dial px-3 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending}
          className="shrink-0 rounded-sm bg-brass px-4 text-sm font-medium text-case disabled:opacity-60"
        >
          Agregar
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {brands.map((b) => (
          <BrandRow
            key={b.id}
            brand={b}
            onUpdated={(updated) =>
              setBrands((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x))
              )
            }
            onDeleted={() =>
              setBrands((prev) => prev.filter((x) => x.id !== b.id))
            }
          />
        ))}
      </ul>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}

function BrandRow({
  brand,
  onUpdated,
  onDeleted,
}: {
  brand: Brand;
  onUpdated: (brand: Brand) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateBrand(brand.id, name);
        onUpdated({ ...brand, name: name.trim() });
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteBrand(brand.id);
        onDeleted();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al eliminar.");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <li className="rounded-sm border border-line bg-dial px-3 py-2">
      <div className="flex items-center gap-3">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-sm border border-line bg-case px-2 py-1 text-sm text-cream outline-none focus:border-brass"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm text-cream">
            {brand.name}{" "}
            <span className="text-xs text-steel">
              · {brand.deviceCount} dispositivo(s)
            </span>
          </span>
        )}

        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="text-sm text-brass underline underline-offset-2 disabled:opacity-60"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(brand.name);
              }}
              className="text-sm text-steel underline underline-offset-2 hover:text-cream"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-steel underline underline-offset-2 hover:text-cream"
            >
              Editar
            </button>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-red-400 underline underline-offset-2 hover:text-red-300"
              >
                Eliminar
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="font-medium text-red-400 underline underline-offset-2 disabled:opacity-60"
                >
                  {isPending ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-steel underline underline-offset-2 hover:text-cream"
                >
                  Cancelar
                </button>
              </span>
            )}
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </li>
  );
}
