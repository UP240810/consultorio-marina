"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { viewEnter } from "@/lib/motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const quote = getQuoteOfTheDay();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="hidden md:flex flex-col justify-between bg-plum text-white p-12 relative overflow-hidden">
        <PsiWatermark />
        <div className="flex items-center gap-3 relative">
          <span className="psi-mark w-10 h-10 text-xl">Ψ</span>
          <span className="font-display text-lg">Consultorio Marina Velázquez</span>
        </div>
        <motion.blockquote
          {...viewEnter}
          className="font-display text-2xl leading-snug max-w-md relative"
        >
          “{quote}”
        </motion.blockquote>
        <p className="text-sm text-white/60 relative">
          Psicología Cognitivo-Conductual · Terapia Gestalt
        </p>
      </section>

      <section className="flex items-center justify-center p-8">
        <motion.form
          {...viewEnter}
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-5"
        >
          <div className="md:hidden flex items-center gap-3 mb-4">
            <span className="psi-mark w-9 h-9 text-lg">Ψ</span>
            <span className="font-display text-lg text-plum">Consultorio</span>
          </div>
          <div>
            <h1 className="font-display text-2xl text-plum">Iniciar sesión</h1>
            <p className="text-sm text-ink/60 mt-1">Acceso exclusivo para la psicóloga.</p>
          </div>

          <div>
            <label className="field-label" htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="marina@tuconsultorio.com"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-risk">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <p className="md:hidden text-sm text-ink/60 italic pt-4 border-t border-lilac/20">
            “{quote}”
          </p>
        </motion.form>
      </section>
    </main>
  );
}

/** Marca de agua discreta con el símbolo Ψ, para que el panel no sea un bloque de color plano. */
function PsiWatermark() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute -right-16 -bottom-20 w-80 h-80 opacity-[0.07] pointer-events-none select-none"
      aria-hidden="true"
    >
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="380"
        fontFamily="var(--font-fraunces), serif"
        fill="white"
      >
        Ψ
      </text>
    </svg>
  );
}
