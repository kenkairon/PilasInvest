import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPendingSuggestions, getFormOptions } from "./actions";
import { SuggestionList } from "@/components/admin/SuggestionList";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const [suggestions, { brands, batteries, categories }] = await Promise.all([
    getPendingSuggestions(),
    getFormOptions(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <AdminNav active="/admin" />
        <LogoutButton />
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold text-cream">
        Sugerencias pendientes ({suggestions.length})
      </h1>

      <div className="mt-8">
        <SuggestionList
          suggestions={suggestions}
          brands={brands}
          batteries={batteries}
          categories={categories}
        />
      </div>
    </main>
  );
}
