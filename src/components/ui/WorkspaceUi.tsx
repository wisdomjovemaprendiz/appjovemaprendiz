import type { ReactNode } from "react";

export function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-blue-700">{icon}</div>
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-blue-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function TableShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-blue-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

export function EmptyTable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
      <p className="font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function StatusPill({
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