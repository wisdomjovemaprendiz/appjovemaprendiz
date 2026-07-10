"use client";

import { logoutAction } from "@/actions/auth.actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  FileText,
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

const navigation = [
  { href: "/rh", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rh/empresas", label: "Empresas", icon: Building2 },
  { href: "/rh/estagiarios", label: "Estagiários", icon: UsersRound },
  { href: "/rh/contratos", label: "Contratos", icon: FileText },
  { href: "/rh/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/rh/documentos", label: "Documentos", icon: FileText },
  { href: "/rh/pendencias", label: "Pendências", icon: BellRing },
  { href: "/rh/match", label: "Match", icon: Handshake },
  { href: "/rh/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/rh/usuarios", label: "Usuários", icon: ShieldCheck },
  { href: "/rh/auditoria", label: "Auditoria", icon: Activity },
  { href: "/rh/configuracoes", label: "Configurações", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/rh") {
    return pathname === "/rh";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-600">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

export function RhShell({
  children,
  organizationLogoUrl,
  organizationName,
}: {
  children: ReactNode;
  organizationLogoUrl?: string | null;
  organizationName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-blue-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex min-h-28 items-center gap-4 border-b border-slate-100 px-6">
          {organizationLogoUrl ? (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <img
                src={organizationLogoUrl}
                alt={organizationName || "Logomarca do sistema"}
                className="h-full w-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-950 shadow-sm ring-1 ring-slate-100">
              RH
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">
              Sistema RH
            </p>

            <p className="mt-1 truncate text-sm font-black text-blue-950">
              {organizationName || "Wisdom"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex items-center gap-3 rounded-2xl bg-blue-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-900"
                    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-slate-100 hover:text-blue-950"
                }
              >
                <Icon
                  className={
                    active
                      ? "h-5 w-5 shrink-0 text-white"
                      : "h-5 w-5 shrink-0 text-blue-950"
                  }
                />

                <span
                  className={
                    active
                      ? "truncate text-white"
                      : "truncate text-blue-950"
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
              title="Encerrar sessão"
            >
              <LogOut className="h-5 w-5" />
              Sair do sistema
            </button>
          </form>

          <div className="mt-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-xs font-bold leading-5 text-yellow-800">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Ao terminar o uso, clique em <strong>Sair</strong> para proteger
                os dados do sistema.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
          <p className="text-sm font-black text-blue-950">
            {organizationName || "Sistema RH Wisdom"}
          </p>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>

        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}