"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, Save, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createEmpresaAction, updateEmpresaAction } from "@/actions/rh/empresa.actions";
import { FormField, TextAreaInput, TextInput } from "@/components/ui/FormControls";
import { SkillPicker } from "@/components/ui/SkillPicker";
import { EmbeddedDocumentoUploadForm } from "@/features/documentos/EmbeddedDocumentoUploadForm";
import { EntityAccessCard } from "@/features/usuarios/EntityAccessCard";
import { empresaSchema, type EmpresaFormData } from "@/schemas/rh.schemas";
import { isValidCnpj, onlyDigits } from "@/lib/brasil/validators";

type EmpresaFormProps = {
  empresaId?: string;
  initialData?: Partial<EmpresaFormData>;
};

type FormResult = {
  ok: boolean;
  message: string;
  id?: string;
};

export function EmpresaForm({ empresaId, initialData }: EmpresaFormProps) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<FormResult | null>(null);
  const [savedEmpresaId, setSavedEmpresaId] = useState<string | null>(empresaId ?? null);
  const [cnpjStatus, setCnpjStatus] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<string | null>(null);

  const isEditing = Boolean(empresaId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome_responsavel: initialData?.nome_responsavel ?? "",
      cnpj: initialData?.cnpj ?? "",
      razao_social: initialData?.razao_social ?? "",
      nome_fantasia: initialData?.nome_fantasia ?? "",
      ramo_atuacao: initialData?.ramo_atuacao ?? "",
      endereco: initialData?.endereco ?? "",
      bairro: initialData?.bairro ?? "",
      cidade: initialData?.cidade ?? "Salvador",
      estado: initialData?.estado ?? "Bahia",
      cep: initialData?.cep ?? "",
      email: initialData?.email ?? "",
      telefone: initialData?.telefone ?? "",
      perfil_candidato: initialData?.perfil_candidato ?? "",
      funcoes_estagiario: initialData?.funcoes_estagiario ?? "",
      valor_bolsa: initialData?.valor_bolsa,
      observacoes: initialData?.observacoes ?? "",
      skills_desejadas: initialData?.skills_desejadas ?? [],
      funcoes_sugeridas: initialData?.funcoes_sugeridas ?? [],
    },
  });

  const skillsDesejadas = watch("skills_desejadas") ?? [];
  const funcoesSugeridas = watch("funcoes_sugeridas") ?? [];
  const cnpj = watch("cnpj") ?? "";
  const cep = watch("cep") ?? "";

  async function buscarCnpj() {
    setCnpjStatus(null);

    if (!cnpj || !isValidCnpj(cnpj)) {
      setCnpjStatus("CNPJ inválido. Confira os números digitados.");
      return;
    }

    const response = await fetch(`/api/cnpj?cnpj=${onlyDigits(cnpj)}`);
    const data = await response.json();

    if (!data.ok) {
      setCnpjStatus(data.message || "Não foi possível consultar o CNPJ.");
      return;
    }

    const empresa = data.empresa;

    setValue("razao_social", empresa.razao_social ?? "");
    setValue("nome_fantasia", empresa.nome_fantasia ?? "");
    setValue("ramo_atuacao", empresa.ramo_atuacao ?? "");
    setValue("email", empresa.email ?? "");
    setValue("telefone", empresa.telefone ?? "");
    setValue("endereco", empresa.endereco ?? "");
    setValue("bairro", empresa.bairro ?? "");
    setValue("cidade", empresa.cidade ?? "Salvador");
    setValue("estado", empresa.estado ?? "Bahia");
    setValue("cep", empresa.cep ?? "");

    setCnpjStatus("Dados encontrados e preenchidos automaticamente.");
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

  function onSubmit(data: EmpresaFormData) {
    setResultado(null);

    startTransition(async () => {
      const result =
        isEditing && empresaId
          ? await updateEmpresaAction(empresaId, data)
          : await createEmpresaAction(data);

      setResultado(result);

      if (result.ok && result.id) {
        setSavedEmpresaId(result.id);
      }

      if (result.ok && !isEditing) {
        reset({
          cidade: "Salvador",
          estado: "Bahia",
          skills_desejadas: [],
          funcoes_sugeridas: [],
        });
        setCnpjStatus(null);
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
              <Building2 className="h-7 w-7 text-blue-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-950">Dados principais</h2>
              <p className="text-sm font-semibold text-slate-500">
                Identificação da empresa e responsável pelo estágio.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="CNPJ" error={errors.cnpj?.message}>
              <div className="flex gap-2">
                <TextInput {...register("cnpj")} placeholder="00.000.000/0000-00" />
                <button
                  type="button"
                  onClick={buscarCnpj}
                  className="btn-wisdom-blue inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </button>
              </div>
              {cnpjStatus ? (
                <p className="mt-2 text-sm font-bold text-blue-700">{cnpjStatus}</p>
              ) : null}
            </FormField>

            <FormField label="Nome do responsável" error={errors.nome_responsavel?.message}>
              <TextInput {...register("nome_responsavel")} placeholder="Ex: Rodrigo Pereira" />
            </FormField>

            <FormField label="Razão social" error={errors.razao_social?.message}>
              <TextInput {...register("razao_social")} placeholder="Razão social da empresa" />
            </FormField>

            <FormField label="Nome fantasia">
              <TextInput {...register("nome_fantasia")} placeholder="Nome comercial" />
            </FormField>

            <FormField label="Ramo de atuação">
              <TextInput {...register("ramo_atuacao")} placeholder="Ex: Roupas, mercado, escritório..." />
            </FormField>

            <FormField label="Valor padrão da bolsa">
              <TextInput {...register("valor_bolsa")} type="number" step="0.01" placeholder="Ex: 650.00" />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-2xl font-black text-blue-950">Contato e endereço</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="E-mail" error={errors.email?.message}>
              <TextInput {...register("email")} type="email" placeholder="empresa@email.com" />
            </FormField>

            <FormField label="Telefone" error={errors.telefone?.message}>
              <TextInput {...register("telefone")} placeholder="(71) 99999-9999" />
            </FormField>

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
              <TextInput {...register("endereco")} placeholder="Rua, avenida, número" />
            </FormField>

            <FormField label="Bairro">
              <TextInput {...register("bairro")} placeholder="Ex: Paripe" />
            </FormField>

            <FormField label="Cidade">
              <TextInput {...register("cidade")} />
            </FormField>

            <FormField label="Estado">
              <TextInput {...register("estado")} />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-6 text-2xl font-black text-blue-950">Perfil da vaga e funções</h2>

          <div className="grid gap-5">
            <SkillPicker
              title="Perfil desejado do candidato"
              description="Selecione as habilidades esperadas para cruzamento com estagiários."
              selected={skillsDesejadas}
              onChange={(skills) => setValue("skills_desejadas", skills, { shouldDirty: true })}
            />

            <SkillPicker
              title="Funções previstas para o estagiário"
              description="Selecione atividades que poderão ser executadas na empresa."
              selected={funcoesSugeridas}
              onChange={(skills) => setValue("funcoes_sugeridas", skills, { shouldDirty: true })}
            />

            <FormField label="Perfil do candidato">
              <TextAreaInput
                {...register("perfil_candidato")}
                placeholder="Detalhes específicos do perfil desejado."
              />
            </FormField>

            <FormField label="Funções do estagiário">
              <TextAreaInput
                {...register("funcoes_estagiario")}
                placeholder="Atividades específicas da empresa."
              />
            </FormField>

            <FormField label="Observações">
              <TextAreaInput
                {...register("observacoes")}
                placeholder="Informações internas, restrições ou detalhes importantes."
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
            {isPending
              ? isEditing
                ? "Atualizando..."
                : "Salvando..."
              : isEditing
                ? "Atualizar empresa"
                : "Salvar empresa"}
          </button>
        </div>
      </form>

      <EntityAccessCard
        entityType="empresa"
        entityId={savedEmpresaId}
        title="Acesso da empresa"
        description="Crie ou atualize o login da empresa para acesso ao portal."
      />

      <EmbeddedDocumentoUploadForm
        entityType="empresa"
        entityId={savedEmpresaId}
        title="Documentos da empresa"
        description="Anexe cartão CNPJ, contrato social, comprovantes e outros documentos."
        defaultCategory="cartao_cnpj"
      />
    </div>
  );
}