"use client";

import {
  Archive,
  BriefcaseBusiness,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SkillOption = {
  id: string;
  name: string;
  category?: string;
};

type VacancySkill = {
  id: string;
  skill_id?: string | null;
  custom_skill?: string | null;
  name: string;
};

type Vacancy = {
  id: string;
  titulo: string;
  area: string;
  perfil_desejado?: string | null;
  quantidade: number;
  turno?: string | null;
  bolsa_auxilio?: number | null;
  observacoes?: string | null;
  status: string;
  skills: VacancySkill[];
};

const areaOptions = [
  "Administrativo",
  "Atendimento ao cliente",
  "Vendas",
  "Operador de caixa",
  "Estoque e reposição",
  "Telemarketing",
  "Informática / tecnologia básica",
  "Comércio",
  "Outros",
];

function money(value: number | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number) || number <= 0) return "Não informado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function statusClass(status: string) {
  if (status === "ativa") {
    return "border-green-100 bg-green-50 text-green-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function SkillChecklist({
  skills,
  selected,
  onToggle,
}: {
  skills: SkillOption[];
  selected: string[];
  onToggle: (skillId: string) => void;
}) {
  if (skills.length === 0) {
    return (
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Nenhuma skill cadastrada no catálogo. Use o campo manual abaixo.
      </p>
    );
  }

  return (
    <div className="mt-3 grid min-w-0 max-w-full gap-2 md:grid-cols-2 xl:grid-cols-3">
      {skills.map((skill) => (
        <label
          key={skill.id}
          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${
            selected.includes(skill.id)
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(skill.id)}
            onChange={() => onToggle(skill.id)}
          />
          {skill.name}
        </label>
      ))}
    </div>
  );
}

export function EmpresaVagasManager({ companyId }: { companyId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [vagas, setVagas] = useState<Vacancy[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSelectedSkills, setEditSelectedSkills] = useState<string[]>([]);
  const [editCustomSkills, setEditCustomSkills] = useState("");

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const activeVacancies = useMemo(
    () => vagas.filter((vaga) => vaga.status === "ativa"),
    [vagas]
  );

  async function loadData() {
    if (!companyId) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/rh/empresas/vagas?company_id=${encodeURIComponent(companyId)}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.ok) {
        setVagas(result.data.vagas ?? []);
        setSkills(result.data.skills ?? []);
      } else {
        setMessage({
          ok: false,
          text: result.message || "Erro ao carregar vagas.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [companyId]);

  function toggleSkill(skillId: string) {
    setSelectedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  function toggleEditSkill(skillId: string) {
    setEditSelectedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  async function createVacancy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!companyId) {
      setMessage({
        ok: false,
        text: "Salve a empresa antes de cadastrar vagas.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(form);

      formData.set("company_id", companyId);
      formData.set("skill_ids", JSON.stringify(selectedSkills));

      const response = await fetch("/api/rh/empresas/vagas", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        form.reset();
        setSelectedSkills([]);
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(vaga: Vacancy) {
    const skillIds = (vaga.skills || [])
      .filter((skill) => skill.skill_id)
      .map((skill) => String(skill.skill_id));

    const customSkills = (vaga.skills || [])
      .filter((skill) => !skill.skill_id && skill.custom_skill)
      .map((skill) => String(skill.custom_skill))
      .join("\n");

    setEditingId(vaga.id);
    setEditSelectedSkills(skillIds);
    setEditCustomSkills(customSkills);
    setMessage(null);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) return;

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      formData.set("vacancy_id", editingId);
      formData.set("skill_ids", JSON.stringify(editSelectedSkills));
      formData.set("custom_skills", editCustomSkills);

      const response = await fetch("/api/rh/empresas/vagas", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setEditingId(null);
        setEditSelectedSkills([]);
        setEditCustomSkills("");
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateVacancyStatus(vacancyId: string, status: string) {
    const response = await fetch("/api/rh/empresas/vagas", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vacancy_id: vacancyId,
        status,
      }),
    });

    const result = await response.json();

    setMessage({
      ok: Boolean(result.ok),
      text: result.message || "Resposta recebida.",
    });

    if (result.ok) {
      await loadData();
    }
  }

  async function deleteVacancy(vaga: Vacancy) {
    const confirmDelete = window.confirm(
      `Excluir definitivamente a vaga "${vaga.titulo || vaga.area}"?`
    );

    if (!confirmDelete) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/rh/empresas/vagas", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vacancy_id: vaga.id,
          confirm_text: "EXCLUIR",
        }),
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        if (editingId === vaga.id) {
          setEditingId(null);
        }

        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!companyId) {
    return (
      <section className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
        <BriefcaseBusiness className="mx-auto h-9 w-9 text-blue-700" />
        <h3 className="mt-3 text-xl font-black text-blue-950">Vagas da empresa</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-blue-900">
          Salve a empresa primeiro. Depois será possível cadastrar uma ou mais vagas,
          cada uma com seu próprio perfil e suas próprias skills.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 max-w-full overflow-x-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-2xl font-black text-blue-950">Vagas e perfil desejado</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Cadastre uma vaga por perfil disponível. Cada vaga pode ter skills diferentes.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
          {activeVacancies.length} ativa(s)
        </span>
      </div>

      {message ? (
        <div
          className={`mb-5 rounded-2xl border p-4 text-sm font-black ${
            message.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form onSubmit={createVacancy} className="min-w-0 max-w-full overflow-x-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
        <div className="grid min-w-0 max-w-full gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Área da vaga</span>
            <select
              name="area"
              required
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Título interno</span>
            <input
              name="titulo"
              placeholder="Ex.: Administrativo manhã"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Quantidade</span>
            <input
              type="number"
              min="1"
              name="quantidade"
              defaultValue="1"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="mt-4 grid min-w-0 max-w-full gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Bolsa prevista</span>
            <input
              name="bolsa_auxilio"
              placeholder="Ex.: 600,00"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Turno</span>
            <select
              name="turno"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="">Não informado</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Noturno">Noturno</option>
              <option value="A combinar">A combinar</option>
            </select>
          </label>
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-black text-blue-950">Perfil desejado do candidato</span>
          <textarea
            name="perfil_desejado"
            rows={4}
            placeholder="Descreva o perfil: comunicação, postura, idade mínima, turno escolar, disponibilidade..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-sm font-black text-blue-950">Skills para essa vaga</p>
          <SkillChecklist
            skills={skills}
            selected={selectedSkills}
            onToggle={toggleSkill}
          />
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-black text-blue-950">Skills manuais adicionais</span>
          <textarea
            name="custom_skills"
            rows={3}
            placeholder="Ex.: boa digitação, facilidade com planilhas, atendimento ao público..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-black text-blue-950">Observações da vaga</span>
          <textarea
            name="observacoes"
            rows={3}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn-wisdom-red mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          {saving ? "Salvando..." : "Adicionar vaga"}
        </button>
      </form>

      <div className="mt-6">
        <h4 className="text-lg font-black text-blue-950">Vagas cadastradas</h4>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-black text-slate-500">
            Carregando vagas...
          </div>
        ) : vagas.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center text-sm font-black text-blue-900">
            Nenhuma vaga cadastrada ainda.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {vagas.map((vaga) => {
              const editing = editingId === vaga.id;

              return (
                <article
                  key={vaga.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="font-black text-blue-950">{vaga.titulo || vaga.area}</h5>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(vaga.status)}`}>
                          {vaga.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {vaga.area} • {vaga.quantidade} vaga(s) • {vaga.turno || "turno não informado"} • {money(vaga.bolsa_auxilio)}
                      </p>

                      {vaga.perfil_desejado ? (
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                          {vaga.perfil_desejado}
                        </p>
                      ) : null}

                      {vaga.skills?.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {vaga.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editing ? setEditingId(null) : startEdit(vaga)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50"
                      >
                        {editing ? <XCircle className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        {editing ? "Cancelar" : "Editar"}
                      </button>

                      {vaga.status === "ativa" ? (
                        <button
                          type="button"
                          onClick={() => updateVacancyStatus(vaga.id, "arquivada")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50"
                        >
                          <Archive className="h-4 w-4" />
                          Arquivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateVacancyStatus(vaga.id, "ativa")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-2 text-sm font-black text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Reativar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteVacancy(vaga)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <form
                      onSubmit={submitEdit}
                      className="mt-5 rounded-2xl border border-blue-100 bg-white p-4"
                    >
                      <div className="mb-4">
                        <h6 className="font-black text-blue-950">Editar vaga</h6>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Altere os dados da vaga e salve.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2">
                          <span className="text-sm font-black text-blue-950">Área da vaga</span>
                          <select
                            name="area"
                            required
                            defaultValue={vaga.area || ""}
                            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
                          >
                            <option value="">Selecione</option>
                            {areaOptions.map((area) => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-black text-blue-950">Título interno</span>
                          <input
                            name="titulo"
                            defaultValue={vaga.titulo || ""}
                            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-black text-blue-950">Quantidade</span>
                          <input
                            type="number"
                            min="1"
                            name="quantidade"
                            defaultValue={vaga.quantidade || 1}
                            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-black text-blue-950">Bolsa prevista</span>
                          <input
                            name="bolsa_auxilio"
                            defaultValue={vaga.bolsa_auxilio ?? ""}
                            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-black text-blue-950">Turno</span>
                          <select
                            name="turno"
                            defaultValue={vaga.turno || ""}
                            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
                          >
                            <option value="">Não informado</option>
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Noturno">Noturno</option>
                            <option value="A combinar">A combinar</option>
                          </select>
                        </label>
                      </div>

                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-black text-blue-950">Perfil desejado do candidato</span>
                        <textarea
                          name="perfil_desejado"
                          rows={4}
                          defaultValue={vaga.perfil_desejado || ""}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </label>

                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm font-black text-blue-950">Skills para essa vaga</p>
                        <SkillChecklist
                          skills={skills}
                          selected={editSelectedSkills}
                          onToggle={toggleEditSkill}
                        />
                      </div>

                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-black text-blue-950">Skills manuais adicionais</span>
                        <textarea
                          rows={3}
                          value={editCustomSkills}
                          onChange={(event) => setEditCustomSkills(event.target.value)}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </label>

                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-black text-blue-950">Observações da vaga</span>
                        <textarea
                          name="observacoes"
                          rows={3}
                          defaultValue={vaga.observacoes || ""}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-wisdom-blue mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-70"
                      >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {saving ? "Salvando..." : "Salvar edição da vaga"}
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}