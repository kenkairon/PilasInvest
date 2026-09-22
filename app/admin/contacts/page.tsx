import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContacts } from "../actions";
import { ContactList } from "@/components/admin/ContactList";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminContactsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const contacts = await getContacts();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <AdminNav active="/admin/contacts" />
        <LogoutButton />
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold text-cream">
        Contactos ({contacts.length})
      </h1>
      <p className="mt-1 text-sm text-steel">
        Todas las personas que dejaron su WhatsApp al sugerir un dispositivo,
        con lo que anotaron. Si un número cambió, puedes corregirlo aquí.
      </p>

      <div className="mt-8">
        <ContactList contacts={contacts} />
      </div>
    </main>
  );
}
