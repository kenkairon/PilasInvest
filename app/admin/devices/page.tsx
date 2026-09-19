import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDevices, getFormOptions } from "../actions";
import { DeviceList } from "@/components/admin/DeviceList";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";


export default async function AdminDevicesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const [devices, { brands, batteries, categories }] = await Promise.all([
    getDevices(),
    getFormOptions(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <AdminNav active="/admin/devices" />
        <LogoutButton />
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold text-cream">
        Dispositivos publicados ({devices.length})
      </h1>

      <div className="mt-8">
        <DeviceList
          devices={devices}
          brands={brands}
          batteries={batteries}
          categories={categories}
        />
      </div>
    </main>
  );
}
