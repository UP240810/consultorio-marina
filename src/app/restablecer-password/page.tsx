"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RestablecerPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // El cliente de Supabase detecta automáticamente el token de
    // recuperación en la URL (?code=... o #access_token=...) y dispara el
    // evento PASSWORD_RECOVERY con una sesión temporal válida solo para
    // cambiar la contraseña.
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    // Si la sesión ya estaba lista antes de suscribirnos (carga directa).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setInvalid(true);
        return r;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(`No se pudo actualizar la contraseña (${error.message}).`);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <main className="min-h-screen bg-mist flex items-center justify-center p-6">
      <div className="card p-8 max-w-sm w-full space-y-5">
        <div className="flex items-center gap-3">
          <span className="psi-mark w-9 h-9 text-lg">Ψ</span>
          <span className="font-display text-plum">Consultorio Marina Velázquez</span>
        </div>

        <div>
          <h1 className="font-display text-2xl text-plum">Nueva contraseña</h1>
          <p className="text-sm text-ink/60 mt-1">
            Elige la contraseña con la que vas a entrar de ahora en adelante.
          </p>
        </div>

        {done ? (
          <p className="text-sm text-ok">
            ✓ Contraseña actualizada. Te llevamos al inicio de sesión…
          </p>
        ) : !ready && invalid ? (
          <p className="text-sm text-risk">
            Este enlace no es válido o ya expiró. Vuelve a la pantalla de inicio de sesión y pide
            uno nuevo con "¿Olvidaste tu contraseña?".
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="new-password">Contraseña nueva</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                className="input-field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-risk">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
