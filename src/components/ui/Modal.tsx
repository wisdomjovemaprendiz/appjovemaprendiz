"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "lg",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const sizeClass = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/50 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${sizeClass} overflow-hidden rounded-3xl bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-black text-blue-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-950"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}