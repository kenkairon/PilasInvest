"use client";

import { useState } from "react";
import { Upload, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressToWebP } from "@/lib/imageCompression";

type Props = {
  onUploaded: (url: string | null) => void;
  /** Foto ya existente (para editar un dispositivo publicado). */
  initialUrl?: string | null;
  /** Subcarpeta dentro del bucket, para separar sugerencias de dispositivos ya publicados. */
  folder?: "suggestions" | "devices";
  /** Texto del botón antes de elegir una foto. */
  label?: string;
};

/**
 * A diferencia de PhotoScanButton (que solo lee texto y descarta la
 * imagen), este componente SÍ sube la foto — al bucket público
 * "device-photos" de Supabase Storage — y entrega la URL pública
 * resultante. Sirve tanto para adjuntar una foto nueva (sugerencias)
 * como para editar la foto de un dispositivo ya publicado (initialUrl).
 */
export function PhotoUploadField({
  onUploaded,
  initialUrl = null,
  folder = "suggestions",
  label = "Agregar foto (opcional)",
}: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    initialUrl ? "done" : "idle"
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [savedPercent, setSavedPercent] = useState<number | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setStatus("uploading");
    setSavedPercent(null);

    try {
      const webpBlob = await compressToWebP(file);
      setSavedPercent(Math.round((1 - webpBlob.size / file.size) * 100));

      const supabase = createClient();
      const path = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;

      const { error } = await supabase.storage
        .from("device-photos")
        .upload(path, webpBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp",
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("device-photos").getPublicUrl(path);

      onUploaded(publicUrl);
      setStatus("done");
    } catch (err) {
      console.error("Error subiendo foto:", err);
      setStatus("error");
      onUploaded(null);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setStatus("idle");
    setSavedPercent(null);
    onUploaded(null);
  }

  return (
    <div>
      {!previewUrl ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm text-steel transition-colors hover:border-brass hover:text-brass">
          <Upload size={16} />
          {label}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Vista previa de la foto"
            className="h-16 w-16 rounded-sm border border-line object-cover"
          />
          <div className="text-sm">
            {status === "uploading" && (
              <p className="text-steel">Subiendo…</p>
            )}
            {status === "done" && (
              <p className="flex items-center gap-1 text-brass">
                <Check size={14} /> Foto agregada
                {savedPercent !== null && savedPercent > 0 && (
                  <span className="text-steel"> · WebP, -{savedPercent}%</span>
                )}
              </p>
            )}
            {status === "error" && (
              <p className="flex items-center gap-1 text-red-400">
                <X size={14} /> No se pudo subir
              </p>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-steel underline underline-offset-2 hover:text-cream"
            >
              Quitar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
