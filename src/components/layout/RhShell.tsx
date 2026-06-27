"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LockKeyhole,
  ScrollText,
  Settings,
  ShieldCheck,
  Target,
  UploadCloud,
  WalletCards,
} from "lucide-react";

const menu = [
  { href: "/rh", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rh/pendencias", label: "Pendências", icon: AlertTriangle },
  { href: "/rh/empresas", label: "Empresas", icon: Building2 },
  { href: "/rh/estagiarios", label: "Estagiários", icon: GraduationCap },
  { href: "/rh/contratos", label: "Contratos", icon: ScrollText },
  { href: "/rh/match", label: "Match", icon: Target },
  { href: "/rh/documentos", label: "Documentos", icon: UploadCloud },
  { href: "/rh/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/rh/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/rh/auditoria", label: "Auditoria", icon: Activity },
  { href: "/rh/usuarios", label: "Usuários", icon: LockKeyhole },
  { href: "/rh/landing", label: "Landing Page", icon: Home },
  { href: "/rh/configuracoes", label: "Configurações", icon: Settings },
];

export function RhShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white xl:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>

              <div>
                <p className="text-lg font-black text-blue-950">RH Wisdom</p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                  Gestão de estágios
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menu.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/rh" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-950"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-black text-blue-950">Ambiente seguro</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Rotas protegidas, perfis de acesso e auditoria de ações.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="xl:pl-72">
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-4xl font-black tracking-tight text-blue-950">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 xl:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/rh" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
                  active
                    ? "bg-blue-700 text-white"
                    : "bg-white text-blue-950"
                }`}
              >
                <Icon className="h-4 w-4 text-blue-700" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}


export function StatusBadge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "ok" | "warning" | "danger" | "info" | "muted";
}) {
  const classes = {
    ok: "border-green-100 bg-green-50 text-green-700",
    warning: "border-yellow-100 bg-yellow-50 text-yellow-800",
    danger: "border-red-100 bg-red-50 text-red-700",
    info: "border-blue-100 bg-blue-50 text-blue-700",
    muted: "border-slate-200 bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${classes}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
      {icon ? <div className="mb-4 flex justify-center text-blue-700">{icon}</div> : null}
      <p className="font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>
    </div>
  );
}