"use client";

import { useState } from "react";

function initials(name: string | null | undefined) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "E";

  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

  return `${first}${second}`.toUpperCase();
}

export function StudentAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string | null | undefined;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);

  const sizeClass = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
  }[size];

  if (photoUrl && !failed) {
    return (
      <div
        className={`${sizeClass} relative shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100`}
      >
        <img
          src={photoUrl}
          alt={name ? `Foto de ${name}` : "Foto do estagiário"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-black text-blue-800`}
      title={photoUrl ? "Foto não carregada" : "Sem foto cadastrada"}
    >
      {initials(name)}
    </div>
  );
}

export function StudentIdentity({
  name,
  photoUrl,
  subtitle,
  size = "md",
}: {
  name: string | null | undefined;
  photoUrl?: string | null;
  subtitle?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <StudentAvatar name={name} photoUrl={photoUrl} size={size} />
      <div className="min-w-0">
        <p className="truncate font-black text-blue-950">
          {name || "Estagiário sem nome definido"}
        </p>
        {subtitle ? (
          <p className="truncate text-xs font-semibold text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}