/**
 * Formatea una fecha de forma IDÉNTICA en servidor y en cliente.
 *
 * `toLocaleDateString()` sin argumentos usa el locale del entorno donde
 * corre: en el servidor (Node) suele ser distinto al del navegador del
 * usuario, y React lanza un error de hidratación porque el HTML generado
 * en el servidor no coincide con el que calcula el cliente al montar.
 *
 * Fijamos locale y timeZone explícitos para que el resultado sea siempre
 * el mismo sin importar dónde se ejecute.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
