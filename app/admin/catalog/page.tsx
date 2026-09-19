import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBrands, getBatteryTypesWithUsage } from "../actions";
import { BrandManager } from "@/components/admin/BrandManager";
import { BatteryManager } from "@/components/admin/BatteryManager";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminCatalogPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const [brands, batteries] = await Promise.all([
    getBrands(),
    getBatteryTypesWithUsage(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <AdminNav active="/admin/catalog" />
        <LogoutButton />
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold text-cream">
        Marcas y tipos de pila
      </h1>
      <p className="mt-1 text-sm text-steel">
        Corrige errores de tipeo o elimina entradas duplicadas. Una marca no
        se puede borrar si hay dispositivos usándola; una pila sí, y esos
        dispositivos simplemente quedan sin pila asignada.
      </p>

      <div className="mt-8 space-y-10">
        <BrandManager initialBrands={brands} />
        <BatteryManager initialBatteries={batteries} />
      </div>
    </main>
  );
}
