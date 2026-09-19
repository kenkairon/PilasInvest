"use server";

import { createClient } from "@/lib/supabase/server";

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
};

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("device_categories")
    .select("id, name, slug, icon")
    .order("sort_order");

  if (error) {
    console.error("getCategories error:", error.message);
    return [];
  }
  return data ?? [];
}

export type DeviceResult = {
  id: number;
  model_name: string;
  model_code: string | null;
  is_solar: boolean;
  no_battery: boolean;
  image_url: string | null;
  brand: { name: string } | null;
  category: { name: string; slug: string; icon: string } | null;
  battery: {
    code: string;
    common_names: string[];
    voltage: number | null;
    diameter_mm: number | null;
    height_mm: number | null;
  } | null;
};

/**
 * Busca dispositivos verificados por texto libre (modelo o código) y,
 * opcionalmente, por categoría.
 */
export async function searchDevices(params: {
  query: string;
  categorySlug?: string | null;
}): Promise<DeviceResult[]> {
  const { query, categorySlug } = params;
  const supabase = createClient();

  let request = supabase
    .from("devices")
    .select(
      `
      id,
      model_name,
      model_code,
      is_solar,
      no_battery,
      image_url,
      brand:brands ( name ),
      category:device_categories ( name, slug, icon ),
      battery:battery_types ( code, common_names, voltage, diameter_mm, height_mm )
    `
    )
    .eq("verified", true)
    .limit(30);

  if (query.trim()) {
    request = request.or(
      `model_name.ilike.%${query}%,model_code.ilike.%${query}%`
    );
  }

  if (categorySlug) {
    request = request.eq("category.slug", categorySlug);
  }

  const { data, error } = await request;

  if (error) {
    console.error("searchDevices error:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    model_name: row.model_name,
    model_code: row.model_code,
    is_solar: row.is_solar,
    no_battery: row.no_battery,
    image_url: row.image_url,
    brand: Array.isArray(row.brand) ? row.brand[0] ?? null : row.brand,
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category,
    battery: Array.isArray(row.battery) ? row.battery[0] ?? null : row.battery,
  }));
}

export type SuggestionInput = {
  categoryName: string;
  brandName: string;
  modelName: string;
  modelCode?: string;
  batteryCodeReported?: string;
  email?: string;
};

export type SuggestionResult = { ok: true } | { ok: false; message: string };

export async function suggestDevice(
  input: SuggestionInput
): Promise<SuggestionResult> {
  if (!input.brandName.trim() || !input.modelName.trim()) {
    return { ok: false, message: "Marca y modelo son obligatorios." };
  }

  const supabase = createClient();

  const { error } = await supabase.from("model_suggestions").insert({
    category_name: input.categoryName.trim() || null,
    brand_name: input.brandName.trim(),
    model_name: input.modelName.trim(),
    model_code: input.modelCode?.trim() || null,
    battery_code_reported: input.batteryCodeReported?.trim() || null,
    email: input.email?.trim() || null,
  });

  if (error) {
    console.error("suggestDevice error:", error.message);
    return { ok: false, message: "No se pudo enviar la sugerencia." };
  }

  return { ok: true };
}
