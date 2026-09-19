"use client";

import { useState, useTransition } from "react";
import {
  createBatteryType,
  updateBatteryType,
  deleteBatteryType,
} from "@/app/admin/actions";

type Battery = {
  id: number;
  code: string;
  voltage: number | null;
  diameter_mm: number | null;
  height_mm: number | null;
  deviceCount: number;
};

export function BatteryManager({
  initialBatteries,
}: {
  initialBatteries: Battery[];
}) {
  const [batteries, setBatteries] = useState(initialBatteries);
  const [newCode, setNewCode] = useState("");
  const [newVoltage, setNewVoltage] = useState("1.55");
  const [newDiameter, setNewDiameter] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    if (!newCode.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const battery = await createBatteryType({
          code: newCode,
          voltage: newVoltage ? Number(newVoltage) : undefined,
          diameterMm: newDiameter ? Number(newDiameter) : undefined,
          heightMm: newHeight ? Number(newHeight) : undefined,
        });
        setBatteries((prev) =>
          [
            {
              ...battery,
              voltage: newVoltage ? Number(newVoltage) : null,
              diameter_mm: newDiameter ? Number(newDiameter) : null,
              height_mm: newHeight ? Number(newHeight) : null,
              deviceCount: 0,
            },
            ...prev,
          ].sort((a, b) => a.code.localeCompare(b.code))
        );
        setNewCode("");
        setNewDiameter("");
        setNewHeight("");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo crear el tipo de pila."
        );
      }
    });
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-cream">
        Tipos de pila
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Código (p. ej. SR927W)"
          className="min-w-[9rem] flex-1 rounded-sm border border-line bg-dial px-3 py-2 text-sm font-mono text-cream outline-none focus:border-brass"
        />
        <input
          value={newVoltage}
          onChange={(e) => setNewVoltage(e.target.value)}
          placeholder="Voltios"
          className="w-20 rounded-sm border border-line bg-dial px-2 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          value={newDiameter}
          onChange={(e) => setNewDiameter(e.target.value)}
          placeholder="Diám. mm"
          className="w-20 rounded-sm border border-line bg-dial px-2 py-2 text-sm text-cream outline-none focus:border-brass"
        />
        <input
          value={newHeight}
          onChange={(e) => setNewHeight(e.target.value)}
          placeholder="Alto mm"
          className="w-20 rounded-sm border border-line bg-dial px-2 py-2 text-sm text-cream outline-none focus:border-brass"
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
        {batteries.map((b) => (
          <BatteryRow
            key={b.id}
            battery={b}
            onUpdated={(updated) =>
              setBatteries((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x))
              )
            }
            onDeleted={() =>
              setBatteries((prev) => prev.filter((x) => x.id !== b.id))
            }
          />
        ))}
      </ul>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}

function BatteryRow({
  battery,
  onUpdated,
  onDeleted,
}: {
  battery: Battery;
  onUpdated: (battery: Battery) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(battery.code);
  const [voltage, setVoltage] = useState(battery.voltage?.toString() ?? "");
  const [diameter, setDiameter] = useState(
    battery.diameter_mm?.toString() ?? ""
  );
  const [height, setHeight] = useState(battery.height_mm?.toString() ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resetFields() {
    setCode(battery.code);
    setVoltage(battery.voltage?.toString() ?? "");
    setDiameter(battery.diameter_mm?.toString() ?? "");
    setHeight(battery.height_mm?.toString() ?? "");
  }

  function handleSave() {
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateBatteryType({
          id: battery.id,
          code,
          voltage: voltage ? Number(voltage) : undefined,
          diameterMm: diameter ? Number(diameter) : undefined,
          heightMm: height ? Number(height) : undefined,
        });
        onUpdated({
          ...battery,
          code: code.trim().toUpperCase(),
          voltage: voltage ? Number(voltage) : null,
          diameter_mm: diameter ? Number(diameter) : null,
          height_mm: height ? Number(height) : null,
        });
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
        await deleteBatteryType(battery.id);
        onDeleted();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al eliminar.");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <li className="rounded-sm border border-line bg-dial px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        {editing ? (
          <div className="flex flex-1 flex-wrap gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-28 rounded-sm border border-line bg-case px-2 py-1 text-sm font-mono text-cream outline-none focus:border-brass"
              autoFocus
            />
            <input
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              placeholder="V"
              className="w-16 rounded-sm border border-line bg-case px-2 py-1 text-sm text-cream outline-none focus:border-brass"
            />
            <input
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="Diám."
              className="w-16 rounded-sm border border-line bg-case px-2 py-1 text-sm text-cream outline-none focus:border-brass"
            />
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Alto"
              className="w-16 rounded-sm border border-line bg-case px-2 py-1 text-sm text-cream outline-none focus:border-brass"
            />
          </div>
        ) : (
          <span className="flex-1 text-sm text-cream">
            <span className="font-mono">{battery.code}</span>{" "}
            <span className="text-xs text-steel">
              · {battery.voltage ? `${battery.voltage}V` : "—"} ·{" "}
              {battery.diameter_mm ?? "—"}×{battery.height_mm ?? "—"}mm ·{" "}
              {battery.deviceCount} dispositivo(s)
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
                resetFields();
                setEditing(false);
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
                <span className="text-steel">
                  {battery.deviceCount > 0
                    ? `${battery.deviceCount} quedarán sin pila.`
                    : "¿Seguro?"}
                </span>
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
