import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

const NAV = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/pacientes", label: "Pacientes" },
  { href: "/dashboard/documentos", label: "Documentos" },
  { href: "/dashboard/estadisticas", label: "Estadísticas" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="bg-plum text-white flex flex-col p-5 gap-8">
        <div className="flex items-center gap-2">
          <span className="psi-mark w-9 h-9 text-lg">Ψ</span>
          <span className="font-display leading-tight text-sm">
            Consultorio
            <br />
            Marina Velázquez
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-card px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <main className="bg-mist p-8">{children}</main>
    </div>
  );
}
