import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export function PageHelp({
  title = "Ajuda da página",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 font-black text-blue-950">
        <HelpCircle className="h-5 w-5 text-blue-700" />
        {title}
      </summary>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </details>
  );
}