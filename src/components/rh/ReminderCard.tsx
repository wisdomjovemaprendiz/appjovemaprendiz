import {
  ignorarPendenciaAction,
  lembrarPendenciaDepoisAction,
  resolverPendenciaAction,
} from "@/actions/rh/reminder.actions";
import type { ReminderListItem } from "@/data/rh/reminders.data";
import { AlertTriangle, CheckCircle2, Clock3, EyeOff } from "lucide-react";

function getEntityLabel(type: ReminderListItem["entity_type"]) {
  const labels = {
    empresa: "Empresa",
    estagiario: "Estagiário",
    contrato: "Contrato",
    financeiro: "Financeiro",
  };

  return labels[type];
}

export function ReminderCard({ reminder }: { reminder: ReminderListItem }) {
  return (
    <article className="rounded-3xl border border-yellow-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-800">
              {getEntityLabel(reminder.entity_type)}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              Campo: {reminder.campo}
            </span>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 rounded-2xl bg-yellow-50 p-3 text-yellow-700">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-xl font-black text-blue-950">
                {reminder.entity_name}
              </h3>

              {reminder.entity_detail ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {reminder.entity_detail}
                </p>
              ) : null}

              <p className="mt-3 leading-7 text-slate-700">
                {reminder.mensagem}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-w-56 gap-2">
          <form action={resolverPendenciaAction}>
            <input type="hidden" name="id" value={reminder.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Resolvido
            </button>
          </form>

          <form action={lembrarPendenciaDepoisAction}>
            <input type="hidden" name="id" value={reminder.id} />
            <input type="hidden" name="dias" value="7" />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-black text-blue-950 hover:bg-yellow-400"
            >
              <Clock3 className="h-4 w-4" />
              Lembrar em 7 dias
            </button>
          </form>

          <form action={ignorarPendenciaAction}>
            <input type="hidden" name="id" value={reminder.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
            >
              <EyeOff className="h-4 w-4" />
              Não lembrar mais
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
