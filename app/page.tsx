import { SearchPanel } from "@/components/SearchPanel";
import { getCategories } from "@/app/actions";

export default async function Home() {
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-steel">
        SR626SW · CR2016 · LR44 · AA · AAA · y más
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-cream">
        ¿Qué pila lleva tu dispositivo?
      </h1>
      <p className="mt-3 text-steel">
        Relojes, básculas, cámaras, controles remotos y más. Si el
        compartimento es accesible, el código grabado en la propia pila
        siempre es la respuesta más segura.
      </p>

      <div className="mt-10">
        <SearchPanel categories={categories} />
      </div>
    </main>
  );
}
