import {
  Watch,
  Scale,
  Camera,
  Radio,
  ToyBrick,
  CircuitBoard,
  type LucideIcon,
} from "lucide-react";

// Mapea la clave "icon" guardada en device_categories a un componente Lucide.
// Si en el futuro agregas una categoría nueva con un icon key nuevo,
// solo hace falta añadir una línea aquí.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  watch: Watch,
  scale: Scale,
  camera: Camera,
  radio: Radio,
  "toy-brick": ToyBrick,
  "circuit-board": CircuitBoard,
};

export function getCategoryIcon(iconKey: string | undefined | null): LucideIcon {
  return CATEGORY_ICONS[iconKey ?? ""] ?? CircuitBoard;
}
