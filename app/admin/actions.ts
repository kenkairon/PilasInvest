"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Device } from "@/components/admin/DeviceRow";

export async function getPendingSuggestions() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("model_suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getFormOptions() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { data: brands, error: brandsError },
    { data: batteries, error: batteriesError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("battery_types").select("id, code").order("code"),
    supabase
      .from("device_categories")
      .select("id, name, slug, icon")
      .order("sort_order"),
  ]);

  if (brandsError) throw new Error(brandsError.message);
  if (batteriesError) throw new Error(batteriesError.message);
  if (categoriesError) throw new Error(categoriesError.message);

  return {
    brands: brands ?? [],
    batteries: batteries ?? [],
    categories: categories ?? [],
  };
}

export async function createBrand(name: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("brands")
    .insert({ name: name.trim(), slug })
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return data;
}

export async function createBatteryType(input: {
  code: string;
  voltage?: number;
  diameterMm?: number;
  heightMm?: number;
  chemistry?: string;
}) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("battery_types")
    .insert({
      code: input.code.trim().toUpperCase(),
      voltage: input.voltage ?? null,
      diameter_mm: input.diameterMm ?? null,
      height_mm: input.heightMm ?? null,
      chemistry: input.chemistry || null,
      common_names: [],
    })
    .select("id, code")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return data;
}

export async function getDevices(): Promise<Device[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("devices")
    .select(
      `
      id,
      model_name,
      model_code,
      is_solar,
      no_battery,
      verified,
      created_at,
      brand:brands ( id, name ),
      category:device_categories ( id, name, slug, icon ),
      battery:battery_types ( id, code )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    model_name: row.model_name,
    model_code: row.model_code,
    is_solar: row.is_solar,
    no_battery: row.no_battery,
    verified: row.verified,
    created_at: row.created_at,
    brand: Array.isArray(row.brand) ? row.brand[0] ?? null : row.brand,
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category,
    battery: Array.isArray(row.battery) ? row.battery[0] ?? null : row.battery,
  }));
}

export type UpdateDeviceInput = {
  id: number;
  categoryId: number;
  brandId: number;
  modelName: string;
  modelCode?: string;
  batteryTypeId: number | null;
  isSolar: boolean;
  noBattery: boolean;
};

export async function updateDevice(input: UpdateDeviceInput) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("devices")
    .update({
      category_id: input.categoryId,
      brand_id: input.brandId,
      model_name: input.modelName,
      model_code: input.modelCode || null,
      battery_type_id: input.noBattery ? null : input.batteryTypeId,
      is_solar: input.isSolar,
      no_battery: input.noBattery,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/devices");
  revalidatePath("/");
}

export async function deleteDevice(id: number) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("devices").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/devices");
  revalidatePath("/");
}

export async function getBrands() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug")
    .order("name");

  if (error) throw new Error(error.message);

  return Promise.all(
    (brands ?? []).map(async (b) => {
      const { count } = await supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", b.id);
      return { ...b, deviceCount: count ?? 0 };
    })
  );
}

export async function updateBrand(id: number, name: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  const { error } = await supabase
    .from("brands")
    .update({ name: name.trim(), slug })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function deleteBrand(id: number) {
  await requireAdmin();
  const supabase = createAdminClient();

  // brands tiene "on delete cascade" hacia devices: si borráramos sin chequear,
  // se borrarían también todos los dispositivos de esa marca. Lo bloqueamos.
  const { count } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id);

  if ((count ?? 0) > 0) {
    throw new Error(
      `No se puede eliminar: ${count} dispositivo(s) usan esta marca. Edítalos primero para asignarles otra.`
    );
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function getBatteryTypesWithUsage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: batteries, error } = await supabase
    .from("battery_types")
    .select("id, code, voltage, diameter_mm, height_mm")
    .order("code");

  if (error) throw new Error(error.message);

  return Promise.all(
    (batteries ?? []).map(async (b) => {
      const { count } = await supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("battery_type_id", b.id);
      return { ...b, deviceCount: count ?? 0 };
    })
  );
}

export async function updateBatteryType(input: {
  id: number;
  code: string;
  voltage?: number;
  diameterMm?: number;
  heightMm?: number;
}) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("battery_types")
    .update({
      code: input.code.trim().toUpperCase(),
      voltage: input.voltage ?? null,
      diameter_mm: input.diameterMm ?? null,
      height_mm: input.heightMm ?? null,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export async function deleteBatteryType(id: number) {
  await requireAdmin();
  const supabase = createAdminClient();

  // battery_type_id tiene "on delete set null": los dispositivos que la usaban
  // NO se borran, solo quedan sin pila asignada. Por eso aquí no bloqueamos,
  // solo informamos el conteo desde la UI para que el admin decida con contexto.
  const { error } = await supabase.from("battery_types").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/catalog");
}

export type ApproveInput = {
  suggestionId: number;
  categoryId: number;
  brandId: number;
  modelName: string;
  modelCode?: string;
  batteryTypeId: number | null;
  isSolar: boolean;
  noBattery: boolean;
};

export async function approveSuggestion(input: ApproveInput) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error: insertError } = await supabase.from("devices").insert({
    category_id: input.categoryId,
    brand_id: input.brandId,
    model_name: input.modelName,
    model_code: input.modelCode || null,
    battery_type_id: input.noBattery ? null : input.batteryTypeId,
    is_solar: input.isSolar,
    no_battery: input.noBattery,
    verified: true,
  });

  if (insertError) throw new Error(insertError.message);

  const { error: updateError } = await supabase
    .from("model_suggestions")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", input.suggestionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin");
}

export async function rejectSuggestion(suggestionId: number, notes?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("model_suggestions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes || null,
    })
    .eq("id", suggestionId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
