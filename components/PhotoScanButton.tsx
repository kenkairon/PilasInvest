"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type Props = {
  onCodesDetected: (codes: string[]) => void;
};

/**
 * Abre la cámara del dispositivo, corre OCR (Tesseract.js) ENTERAMENTE
 * en el navegador sobre la foto tomada, y descarta la imagen de inmediato:
 * - La foto nunca se sube a un servidor ni se guarda en Supabase.
 * - Solo el texto detectado (candidatos a código de modelo/pila) sale de
 *   este componente, vía onCodesDetected.
 * - Tesseract.js se importa dinámicamente dentro del handler para que
 *   nunca se evalúe durante el renderizado en servidor (usa APIs de
 *   navegador que no existen en Node).
 */
export function PhotoScanButton({ onCodesDetected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "error">("idle");
  const [progress, setProgress] = useState(0);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto después
    if (!file) return;

    setStatus("reading");
    setProgress(0);

    // La imagen vive solo en memoria del navegador (Blob URL), nunca se
    // envía a ningún servidor.
    const objectUrl = URL.createObjectURL(file);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(objectUrl);
      await worker.terminate();

      const codes = extractCandidateCodes(text);

      if (codes.length === 0) {
        setStatus("error");
      } else {
        onCodesDetected(codes);
        setStatus("idle");
      }
    } catch (err) {
      console.error("OCR error:", err);
      setStatus("error");
    } finally {
      // Se libera la imagen de memoria; en ningún momento se guardó en disco
      // ni se subió a un servidor.
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "reading"}
        className="flex items-center gap-2 rounded-sm border border-line px-3 py-2.5 text-sm text-steel transition-colors hover:border-brass hover:text-brass disabled:opacity-60"
      >
        <Camera size={16} />
        {status === "reading" ? `Leyendo… ${progress}%` : "Escanear foto"}
      </button>

      {status === "error" && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <X size={12} /> No pudimos leer texto en la foto. Prueba con más luz
          y enfocando bien el código.
        </p>
      )}
    </div>
  );
}

/**
 * Extrae tokens alfanuméricos que parecen códigos (números de módulo,
 * códigos de pila, modelos) del texto crudo que devuelve el OCR.
 * El OCR de una foto de cámara es ruidoso, así que esto es una heurística:
 * se muestran varios candidatos y el usuario/la búsqueda deciden cuál sirve.
 */
function extractCandidateCodes(rawText: string): string[] {
  const tokens = rawText
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && t.length <= 12)
    // descarta tokens que son solo letras repetidas o ruido obvio de OCR
    .filter((t) => /[0-9]/.test(t) || t.length <= 6);

  // Prioriza tokens que combinan letras y números (más probable que sean
  // un código real, ej. "SR626SW", "F91W", "CR2016") sobre números sueltos.
  const withLettersAndDigits = tokens.filter(
    (t) => /[A-Z]/.test(t) && /[0-9]/.test(t)
  );
  const rest = tokens.filter((t) => !withLettersAndDigits.includes(t));

  const ordered = [...withLettersAndDigits, ...rest];
  return Array.from(new Set(ordered)).slice(0, 6);
}
