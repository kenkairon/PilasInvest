"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-wide text-steel">
        Acceso restringido
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-cream">
        Panel de administración
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-line bg-dial px-3 py-2 text-cream outline-none focus:border-brass"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-line bg-dial px-3 py-2 text-cream outline-none focus:border-brass"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-brass px-4 py-2 font-medium text-case disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </main>
  );
}
