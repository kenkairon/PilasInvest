"use client";

import { useState, useTransition } from "react";
import {
  updateDevice,
  deleteDevice,
  createBrand,
  createBatteryType,
} from "@/app/admin/actions";
import { getCategoryIcon } from "@/lib/icons";
import { PhotoUploadField } from "@/components/PhotoUploadField";

export type Device = {
  id: number;
  model_name: string;
  model_code: string | null;
  image_url: string | null;
  image_url_2: string | null;
  is_solar: boolean;
  no_battery: boolean;
  verified: boolean;
  created_at: string;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string; slug: string; icon: string } | null;
  battery: { id: number; code: string } | null;
};

type Option = { id: number; name: string };
type BatteryOption = { id: number; code: string };
type CategoryOption = { id: number; name: string; slug: string; icon: string };

export function DeviceRow({
  device,
  brands,
  batteries,
  categories,
  onUpdated,
  onDeleted,
  onBrandCreated,
  onBatteryCreated,
}: {
  device: Device;
  brands: Option[];
  batteries: BatteryOption[];
  categories: CategoryOption[];
  onUpdated: (device: Device) => void;
  onDeleted: () => void;
  onBrandCreated: (brand: Option) => void;
  onBatteryCreated: (battery: BatteryOption) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [categoryId, setCategoryId] = useState(
    device.category ? String(device.category.id) : ""
  );
  const [brandId, setBrandId] = useState(
    device.brand ? String(device.brand.id) : ""
  );
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const [modelName, setModelName] = useState(device.model_name);
  const [modelCode, setModelCode] = useState(device.model_code ?? "");

  const [batteryTypeId, setBatteryTypeId] = useState(
    device.battery ? String(device.battery.id) : ""
  );
  const [addingBattery, setAddingBattery] = useState(false);
  const [newBatteryCode, setNewBatteryCode] = useState("");
  const [newBatteryVoltage, setNewBatteryVoltage] = useState("1.55");
  const [newBatteryDiameter, setNewBatteryDiameter] = useState("");
  const [newBatteryHeight, setNewBatteryHeight] = useState("");

  const [isSolar, setIsSolar] = useState(device.is_solar);
  const [noBattery, setNoBattery] = useState(device.no_battery);
  const [imageUrl, setImageUrl] = useState<string | null>(device.image_url);
  const [imageUrl2, setImageUrl2] = useState<string | null>(device.image_url_2);

  function resetToDeviceValues() {
    setCategoryId(device.category ? String(device.category.id) : "");
    setBrandId(device.brand ? String(device.brand.id) : "");
    setModelName(device.model_name);
    setModelCode(device.model_code ?? "");
    setBatteryTypeId(device.battery ? String(device.battery.id) : "");
    setIsSolar(device.is_solar);
    setNoBattery(device.no_battery);
    setImageUrl(device.image_url);
    setImageUrl2(device.image_url_2);
    setError(null);
  }

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

  function handleSave() {
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
        await updateDevice({
          id: device.id,
          categoryId: Number(categoryId),
          brandId: Number(brandId),
          modelName,
          modelCode,
          batteryTypeId: noBattery ? null : Number(batteryTypeId),
          isSolar,
          noBattery,
          imageUrl,
          imageUrl2,
        });

        const category = categories.find((c) => c.id === Number(categoryId));
        const brand = brands.find((b) => b.id === Number(brandId));
        const battery = batteries.find((b) => b.id === Number(batteryTypeId));

        onUpdated({
          ...device,
          category: category
            ? { id: category.id, name: category.name, slug: category.slug, icon: category.icon }
            : device.category,
          brand: brand ? { id: brand.id, name: brand.name } : device.brand,
          model_name: modelName,
          model_code: modelCode || null,
          battery: noBattery ? null : battery ? { id: battery.id, code: battery.code } : device.battery,
          is_solar: isSolar,
          no_battery: noBattery,
          image_url: imageUrl,
          image_url_2: imageUrl2,
        });

        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteDevice(device.id);
        onDeleted();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al eliminar.");
      }
    });
  }

  const Icon = getCategoryIcon(device.category?.icon);

  if (!editing) {
    return (
      <li className="flex items-start gap-4 rounded-sm border border-line bg-dial p-4">
        <div className="flex shrink-0 gap-1.5">
          {device.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={device.image_url}
              alt={device.model_name}
              className="h-10 w-10 rounded-sm border border-line object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-case text-steel">
              <Icon size={18} strokeWidth={1.75} />
            </div>
          )}
          {device.image_url_2 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={device.image_url_2}
              alt={`${device.model_name} (foto 2)`}
              className="h-10 w-10 rounded-sm border border-line object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-steel">
            {device.category?.name} · {device.brand?.name}
          </p>
          <p className="truncate font-medium text-cream">
            {device.model_name}
            {device.model_code ? (
              <span className="ml-2 font-mono text-xs text-steel">
                {device.model_code}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 font-mono text-xs text-brass">
            {device.no_battery ? "sin pila reemplazable" : device.battery?.code}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => {
              resetToDeviceValues();
              setEditing(true);
            }}
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
              <span className="text-steel">¿Seguro?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="font-medium text-red-400 underline underline-offset-2 hover:text-red-300 disabled:opacity-60"
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
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-sm border border-brass/60 bg-dial p-4">
      <div className="mb-1.5 text-xs text-steel">Categoría</div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const CatIcon = getCategoryIcon(c.icon);
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
              <CatIcon size={13} />
              {c.name}
            </button>
          );
        })}
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

      <div className="mt-4 space-y-2">
        <p className="mb-1.5 text-xs text-steel">Fotos</p>
        <PhotoUploadField
          label="Foto 1"
          initialUrl={imageUrl}
          folder="devices"
          onUploaded={setImageUrl}
        />
        <PhotoUploadField
          label="Foto 2 (opcional)"
          initialUrl={imageUrl2}
          folder="devices"
          onUploaded={setImageUrl2}
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
          onClick={handleSave}
          disabled={isPending}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-case disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => {
            resetToDeviceValues();
            setEditing(false);
          }}
          disabled={isPending}
          className="rounded-sm border border-line px-4 py-2 text-sm text-steel hover:text-cream disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </li>
  );
}
