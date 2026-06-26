import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  Handshake,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const menu = [
  { label: "Dashboard", href: "/rh", icon: LayoutDashboard },
  { label: "Pendências", href: "/rh/pendencias", icon: BellRing },
  { label: "Empresas", href: "/rh/empresas", icon: Building2 },
  { label: "Estagiários", href: "/rh/estagiarios", icon: GraduationCap },
  { label: "Contratos", href: "/rh/contratos", icon: FileText },
  { label: "Match", href: "/rh/match", icon: Handshake },
  { label: "Documentos", href: "/rh/documentos", icon: FolderOpen },
  { label: "Financeiro", href: "/rh/financeiro", icon: Wallet },
  { label: "Relatórios", href: "/rh/relatorios", icon: BarChart3 },
  { label: "Auditoria", href: "/rh/auditoria", icon: ShieldCheck },
  { label: "Landing Page", href: "/rh/landing", icon: ClipboardList },
  { label: "Configurações", href: "/rh/configuracoes", icon: Settings },
];

export function RhShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-blue-100 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-blue-100 p-5">
            <Link href="/" className="block">
              <img
                src="/logo-wisdom.png"
                alt="Wisdom Jovem Aprendiz"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Painel RH
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                >
                  <Icon className="h-5 w-5 text-blue-700" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-blue-100 p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 hover:bg-blue-50"
            >
              <Home className="h-5 w-5 text-blue-700" />
              Ver site público
            </Link>

            <Link
              href="/login"
              className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 text-red-700" />
              Sair
            </Link>
          </div>
        </div>
      </aside>

      <section className="lg:pl-72">
        <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 px-6 py-4 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <img
              src="/logo-wisdom.png"
              alt="Wisdom Jovem Aprendiz"
              className="h-12 w-auto object-contain"
            />
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
              RH
            </div>
          </div>
        </div>

        {children}
      </section>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-blue-100 bg-white px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950 md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  );
}

export function StatusBadge({
  type,
}: {
  type: "critico" | "atencao" | "ok" | "info";
}) {
  const styles = {
    critico: "bg-red-50 text-red-700 border-red-100",
    atencao: "bg-yellow-50 text-yellow-800 border-yellow-100",
    ok: "bg-green-50 text-green-700 border-green-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
  };

  const labels = {
    critico: "Crítico",
    atencao: "Atenção",
    ok: "Em dia",
    info: "Informativo",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        {icon ?? <AlertTriangle className="h-7 w-7" />}
      </div>
      <h2 className="text-2xl font-black text-blue-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}
