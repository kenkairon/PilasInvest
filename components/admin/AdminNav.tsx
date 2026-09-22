import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Sugerencias" },
  { href: "/admin/devices", label: "Dispositivos" },
  { href: "/admin/catalog", label: "Marcas y pilas" },
  { href: "/admin/contacts", label: "Contactos" },
] as const;

export function AdminNav({ active }: { active: (typeof LINKS)[number]["href"] }) {
  return (
    <nav className="flex gap-4 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            link.href === active
              ? "font-medium text-brass"
              : "text-steel underline underline-offset-2 hover:text-cream"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
