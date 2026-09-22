"use client";

import { useState, useTransition } from "react";
import { updateContactWhatsapp } from "@/app/admin/actions";
import { formatDate } from "@/lib/format";

type Contact = {
  id: number;
  whatsapp: string | null;
  category_name: string | null;
  brand_name: string;
  model_name: string;
  model_code: string | null;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export function ContactList({ contacts }: { contacts: Contact[] }) {
  const [items, setItems] = useState(contacts);
  const [query, setQuery] = useState("");

  function handleUpdated(id: number, whatsapp: string) {
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, whatsapp } : c))
    );
  }

  const filtered = items.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.whatsapp?.toLowerCase().includes(q) ||
      c.brand_name.toLowerCase().includes(q) ||
      c.model_name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrar por número, marca o modelo…"
        className="w-full rounded-sm border border-line bg-dial px-4 py-2.5 text-sm text-cream outline-none focus:border-brass"
      />

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-sm border border-line bg-dial p-5 text-steel">
          No hay contactos que coincidan.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((c) => (
            <ContactRow key={c.id} contact={c} onUpdated={handleUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  onUpdated,
}: {
  contact: Contact;
  onUpdated: (id: number, whatsapp: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(contact.whatsapp ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!value.trim()) {
      setError("El WhatsApp no puede quedar vacío.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateContactWhatsapp(contact.id, value);
        onUpdated(contact.id, value.trim());
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar.");
      }
    });
  }

  return (
    <li className="rounded-sm border border-line bg-dial p-4">
      <div className="flex items-center justify-between gap-3">
        {!editing ? (
          <a
            href={`https://wa.me/${(contact.whatsapp ?? "").replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-brass hover:underline"
          >
            📱 {contact.whatsapp}
          </a>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            placeholder="+56912345678"
            className="w-full max-w-[220px] rounded-sm border border-line bg-case px-2 py-1.5 font-mono text-sm text-cream outline-none focus:border-brass"
          />
        )}

        <div className="flex shrink-0 gap-3 text-sm">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="text-brass underline underline-offset-2 disabled:opacity-60"
              >
                {isPending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(contact.whatsapp ?? "");
                  setEditing(false);
                  setError(null);
                }}
                className="text-steel underline underline-offset-2 hover:text-cream"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-steel underline underline-offset-2 hover:text-cream"
            >
              Editar número
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-cream">
        {contact.category_name ? `${contact.category_name} · ` : ""}
        {contact.brand_name} — {contact.model_name}
        {contact.model_code && (
          <span className="ml-2 font-mono text-xs text-steel">
            {contact.model_code}
          </span>
        )}
      </p>

      <p className="mt-1 text-xs text-steel">
        {formatDate(contact.created_at)} ·{" "}
        {STATUS_LABEL[contact.status] ?? contact.status}
      </p>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </li>
  );
}
