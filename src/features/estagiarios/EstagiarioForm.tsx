"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, MapPin, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { createEstagiarioAction, updateEstagiarioAction } from "@/actions/rh/estagiario.actions";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/ui/FormControls";
import { SkillPicker } from "@/components/ui/SkillPicker";
import { EmbeddedDocumentoUploadForm } from "@/features/documentos/EmbeddedDocumentoUploadForm";
import { EntityAccessCard } from "@/features/usuarios/EntityAccessCard";
import { EstagiarioPhotoCard } from "@/features/estagiarios/EstagiarioPhotoCard";
import { estagiarioSchema, type EstagiarioFormData } from "@/schemas/rh.schemas";
import { isValidCpf, onlyDigits } from "@/lib/brasil/validators";

type EstagiarioFormProps = {
  estagiarioId?: string;
  initialData?: Partial<EstagiarioFormData>;
};

type FormResult = {
  ok: boolean;
  message: string;
  id?: string;
};

export function EstagiarioForm({ estagiarioId, initialData }: EstagiarioFormProps) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<FormResult | null>(null);
  const [savedEstagiarioId, setSavedEstagiarioId] = useState<string | null>(estagiarioId ?? null);
  const [cpfStatus, setCpfStatus] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<string | null>(null);

  const isEditing = Boolean(estagiarioId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EstagiarioFormData>({
    resolver: zodResolver(estagiarioSchema) as Resolver<EstagiarioFormData>,
    defaultValues: {
      nome: initialData?.nome ?? "",
      data_nascimento: initialData?.data_nascimento ?? "",
      cpf: initialData?.cpf ?? "",
      rg: initialData?.rg ?? "",
      telefone: initialData?.telefone ?? "",
      email: initialData?.email ?? "",
      serie_ano: initialData?.serie_ano ?? "",
      turno: initialData?.turno ?? "",
      escola: initialData?.escola ?? "",
      endereco: initialData?.endereco ?? "",
      bairro: initialData?.bairro ?? "",
      cidade: initialData?.cidade ?? "Salvador",
      estado: initialData?.estado ?? "Bahia",
      cep: initialData?.cep ?? "",
      loja_trabalho: initialData?.loja_trabalho ?? "",
      funcao: initialData?.funcao ?? "",
      valor_bolsa: initialData?.valor_bolsa,
      data_vencimento_seguro: initialData?.data_vencimento_seguro ?? "",
      numero_apolice: initialData?.numero_apolice ?? "",
      seguradora: initialData?.seguradora ?? "",
      observacoes: initialData?.observacoes ?? "",
      skills: initialData?.skills ?? [],
    },
  });

  const skills = watch("skills") ?? [];
  const cpf = watch("cpf") ?? "";
  const cep = watch("cep") ?? "";

  function validarCpfDigitado() {
    if (!cpf) {
      setCpfStatus(null);
      return;
    }

    setCpfStatus(
      isValidCpf(cpf)
        ? "CPF válido."
        : "CPF inválido. Confira os números digitados."
    );
  }

  async function buscarCep() {
    setCepStatus(null);

    const digits = onlyDigits(cep);

    if (digits.length !== 8) {
      setCepStatus("Informe um CEP com 8 dígitos.");
      return;
    }

    const response = await fetch(`/api/cep?cep=${digits}`);
    const data = await response.json();

    if (!data.ok) {
      setCepStatus(data.message || "Não foi possível consultar o CEP.");
      return;
    }

    setValue("endereco", data.endereco.logradouro ?? "");
    setValue("bairro", data.endereco.bairro ?? "");
    setValue("cidade", data.endereco.cidade ?? "Salvador");
    setValue("estado", data.endereco.estado ?? "Bahia");
    setValue("cep", data.endereco.cep ?? cep);

    setCepStatus("Endereço preenchido pelo CEP.");
  }

  function onSubmit(data: EstagiarioFormData) {
    setResultado(null);

    if (data.cpf && !isValidCpf(data.cpf)) {
      setResultado({
        ok: false,
        message: "CPF inválido. Corrija o CPF ou apague o campo para salvar o cadastro rápido.",
      });
      return;
    }

    startTransition(async () => {
      const result =
        isEditing && estagiarioId
          ? await updateEstagiarioAction(estagiarioId, data)
          : await createEstagiarioAction(data);

      setResultado(result);

      if (result.ok && result.id) {
        setSavedEstagiarioId(result.id);
      }

      if (result.ok && !isEditing) {
        reset({
          cidade: "Salvador",
          estado: "Bahia",
          skills: [],
        });
        setCpfStatus(null);
        setCepStatus(null);
      }
    });
  }

  return (
    <div className="space-y-6">
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
              <GraduationCap className="h-7 w-7 text-blue-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-950">Dados pessoais</h2>
              <p className="text-sm font-semibold text-slate-500">
                Identificação e contato do estagiário.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Nome completo" error={errors.nome?.message}>
              <TextInput {...register("nome")} placeholder="Nome do estagiário" />
            </FormField>

            <FormField label="Data de nascimento" error={errors.data_nascimento?.message}>
              <TextInput {...register("data_nascimento")} type="date" />
            </FormField>

            <FormField label="CPF">
              <TextInput
                {...register("cpf")}
                onBlur={validarCpfDigitado}
                placeholder="000.000.000-00"
              />
              {cpfStatus ? (
                <p
                  className={`mt-2 text-sm font-bold ${
                    cpfStatus.includes("válido") && !cpfStatus.includes("inválido")
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {cpfStatus}
                </p>
              ) : null}
            </FormField>

            <FormField label="RG">
              <TextInput {...register("rg")} placeholder="Documento de identidade" />
            </FormField>

            <FormField label="Telefone" error={errors.telefone?.message}>
              <TextInput {...register("telefone")} placeholder="(71) 99999-9999" />
            </FormField>

            <FormField label="E-mail" error={errors.email?.message}>
              <TextInput {...register("email")} type="email" placeholder="aluno@email.com" />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-2xl font-black text-blue-950">Dados escolares</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Série/Ano escolar" error={errors.serie_ano?.message}>
              <SelectInput {...register("serie_ano")}>
                <option value="">Selecione</option>
                <option value="1º ano">1º ano</option>
                <option value="2º ano">2º ano</option>
                <option value="3º ano">3º ano</option>
                <option value="EJA">EJA</option>
                <option value="Técnico">Técnico</option>
                <option value="Superior">Superior</option>
              </SelectInput>
            </FormField>

            <FormField label="Turno" error={errors.turno?.message}>
              <SelectInput {...register("turno")}>
                <option value="">Selecione</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Noturno">Noturno</option>
                <option value="Integral">Integral</option>
              </SelectInput>
            </FormField>

            <FormField label="Escola" error={errors.escola?.message}>
              <TextInput {...register("escola")} placeholder="Nome da escola/instituição" />
            </FormField>

            <FormField label="Empresa/loja onde trabalha">
              <TextInput {...register("loja_trabalho")} placeholder="Empresa vinculada ou loja" />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-2xl font-black text-blue-950">Endereço e estágio</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="CEP">
              <div className="flex gap-2">
                <TextInput {...register("cep")} placeholder="00000-000" />
                <button
                  type="button"
                  onClick={buscarCep}
                  className="btn-wisdom-blue inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black"
                >
                  <MapPin className="h-4 w-4" />
                  CEP
                </button>
              </div>
              {cepStatus ? (
                <p className="mt-2 text-sm font-bold text-blue-700">{cepStatus}</p>
              ) : null}
            </FormField>

            <FormField label="Endereço" error={errors.endereco?.message}>
              <TextInput {...register("endereco")} placeholder="Rua, número e complemento" />
            </FormField>

            <FormField label="Bairro">
              <TextInput {...register("bairro")} placeholder="Ex: São Caetano" />
            </FormField>

            <FormField label="Cidade">
              <TextInput {...register("cidade")} />
            </FormField>

            <FormField label="Estado">
              <TextInput {...register("estado")} />
            </FormField>

            <FormField label="Função">
              <TextInput {...register("funcao")} placeholder="Ex: Atendimento, vendas, caixa" />
            </FormField>

            <FormField label="Valor da bolsa">
              <TextInput {...register("valor_bolsa")} type="number" step="0.01" placeholder="Ex: 650.00" />
            </FormField>

            <FormField label="Data de vencimento do seguro">
              <TextInput {...register("data_vencimento_seguro")} type="date" />
            </FormField>

            <FormField label="Número da apólice">
              <TextInput {...register("numero_apolice")} placeholder="Número da apólice" />
            </FormField>

            <FormField label="Seguradora">
              <TextInput {...register("seguradora")} placeholder="Nome da seguradora" />
            </FormField>
          </div>

          <div className="mt-5">
            <FormField label="Observações">
              <TextAreaInput
                {...register("observacoes")}
                placeholder="Informações importantes sobre o estudante, contrato, documentação ou acompanhamento."
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-2xl font-black text-blue-950">Skills para match com empresas</h2>

          <SkillPicker
            title="Habilidades do estagiário"
            description="Selecione habilidades, funções e características do estudante."
            selected={skills}
            onChange={(selectedSkills) => setValue("skills", selectedSkills, { shouldDirty: true })}
          />
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="btn-wisdom-red inline-flex items-center gap-2 rounded-xl px-6 py-4 font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-5 w-5" />
            {isPending
              ? isEditing
                ? "Atualizando..."
                : "Salvando..."
              : isEditing
                ? "Atualizar estagiário"
                : "Salvar estagiário"}
          </button>
        </div>
      </form>

      <EstagiarioPhotoCard estagiarioId={savedEstagiarioId} />

      <EntityAccessCard
        entityType="estagiario"
        entityId={savedEstagiarioId}
        title="Acesso do estagiário"
        description="Crie ou atualize o login do estagiário para acesso ao portal."
      />

      <EmbeddedDocumentoUploadForm
        entityType="estagiario"
        entityId={savedEstagiarioId}
        title="Documentos do estagiário"
        description="Anexe documentos pessoais, declaração escolar, comprovantes, apólice e outros arquivos."
        defaultCategory="documentos_pessoais"
      />
    </div>
  );
}