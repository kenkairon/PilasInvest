/**
 * Convierte cualquier imagen (jpg, png, heic-vía-input, etc.) a WebP
 * ENTERAMENTE en el navegador, antes de subirla — así lo que llega a
 * Supabase Storage ya pesa menos, sin necesidad de procesarla en un
 * servidor aparte.
 *
 * También reduce el tamaño si la foto es más grande que maxDimension,
 * que suele pesar más que la propia conversión de formato.
 */
export async function compressToWebP(
  file: File,
  { maxDimension = 1280, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo comprimir la imagen a WebP.")),
      "image/webp",
      quality
    );
  });
}
