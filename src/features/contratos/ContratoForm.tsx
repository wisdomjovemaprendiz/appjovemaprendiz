"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { createContratoAction } from "@/actions/rh/contrato.actions";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/ui/FormControls";
import { contratoSchema, type ContratoFormData } from "@/schemas/rh.schemas";
import type { SelectOption } from "@/data/rh/contratos.data";

export function ContratoForm({
  empresas,
  estagiarios,
}: {
  empresas: SelectOption[];
  estagiarios: SelectOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema) as Resolver<ContratoFormData>,
    defaultValues: {
      student_id: "",
      company_id: "",
      data_inicio: "",
      data_fim: "",
      horario: "",
      carga_horaria_semanal: "",
      bolsa_auxilio: undefined,
      auxilio_transporte: "",
      atividades: "",
      supervisor_nome: "",
      supervisor_cargo: "",
      supervisor_email: "",
      apolice_numero: "",
      seguradora: "",
      data_vencimento_seguro: "",
      observacoes: "",
    },
  });

  function onSubmit(data: ContratoFormData) {
    setResultado(null);

    startTransition(async () => {
      const result = await createContratoAction(data);
      setResultado(result);

      if (result.ok) {
        reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {resultado ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-black ${
            resultado.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {resultado.message}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3">
            <FileText className="h-7 w-7 text-blue-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              Novo contrato de estágio
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              O contrato pode ser salvo como rascunho mesmo incompleto. As pendências aparecerão no dashboard.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Estagiário" error={errors.student_id?.message}>
            <SelectInput {...register("student_id")}>
              <option value="">Selecione o estagiário</option>
              {estagiarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.detail ? ` — ${item.detail}` : ""}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Empresa concedente" error={errors.company_id?.message}>
            <SelectInput {...register("company_id")}>
              <option value="">Selecione a empresa</option>
              {empresas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.detail ? ` — ${item.detail}` : ""}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Data de início">
            <TextInput {...register("data_inicio")} type="date" />
          </FormField>

          <FormField label="Data de término">
            <TextInput {...register("data_fim")} type="date" />
          </FormField>

          <FormField label="Horário">
            <TextInput {...register("horario")} placeholder="Ex: 08h às 12h" />
          </FormField>

          <FormField label="Carga horária semanal">
            <TextInput {...register("carga_horaria_semanal")} placeholder="Ex: 20 horas semanais" />
          </FormField>

          <FormField label="Bolsa-auxílio">
            <TextInput {...register("bolsa_auxilio")} type="number" step="0.01" placeholder="Ex: 650.00" />
          </FormField>

          <FormField label="Auxílio transporte">
            <TextInput {...register("auxilio_transporte")} placeholder="Ex: incluso, R$ 120,00..." />
          </FormField>

          <FormField label="Supervisor">
            <TextInput {...register("supervisor_nome")} placeholder="Nome do supervisor" />
          </FormField>

          <FormField label="Cargo do supervisor">
            <TextInput {...register("supervisor_cargo")} placeholder="Ex: Gerente, encarregado..." />
          </FormField>

          <FormField label="E-mail do supervisor" error={errors.supervisor_email?.message}>
            <TextInput {...register("supervisor_email")} type="email" placeholder="supervisor@email.com" />
          </FormField>

          <FormField label="Número da apólice">
            <TextInput {...register("apolice_numero")} placeholder="Número da apólice de seguro" />
          </FormField>

          <FormField label="Seguradora">
            <TextInput {...register("seguradora")} placeholder="Nome da seguradora" />
          </FormField>

          <FormField label="Vencimento do seguro">
            <TextInput {...register("data_vencimento_seguro")} type="date" />
          </FormField>
        </div>

        <div className="mt-5 grid gap-5">
          <FormField label="Atividades do estagiário">
            <TextAreaInput
              {...register("atividades")}
              placeholder="Descreva as atividades previstas no estágio."
            />
          </FormField>

          <FormField label="Observações">
            <TextAreaInput
              {...register("observacoes")}
              placeholder="Informações internas, pendências, detalhes de assinatura ou documentos."
            />
          </FormField>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="btn-wisdom-red inline-flex items-center gap-2 rounded-xl px-6 py-4 font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {isPending ? "Salvando..." : "Salvar contrato"}
        </button>
      </div>
    </form>
  );
}