"use client";

import {
  alterarStatusUsuarioAction,
  criarUsuarioSistemaAction,
  redefinirSenhaUsuarioAction,
  type UsuarioActionResult,
} from "@/actions/rh/usuario.actions";
import { Modal } from "@/components/ui/Modal";
import type { UsuarioOption, UsuarioSistema } from "@/data/rh/usuarios.data";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type Row = UsuarioSistema & Record<string, unknown>;

const initialActionState: UsuarioActionResult = {
  ok: false,
  message: "",
};

function getValue(row: Record<string, unknown> | null | undefined, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function roleLabel(role: string) {
  if (role === "rh_master") return "RH master";
  if (role === "rh_operador") return "RH operador";
  if (role === "empresa") return "Empresa";
  if (role === "estagiario") return "Estagiário";
  return role || "Sem perfil";
}

function statusClass(status: string) {
  if (status === "ativo") return "border-green-100 bg-green-50 text-green-700";
  if (status === "bloqueado") return "border-red-100 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function roleClass(role: string) {
  if (role === "rh_master") return "border-blue-100 bg-blue-50 text-blue-700";
  if (role === "rh_operador") return "border-blue-100 bg-blue-50 text-blue-700";
  if (role === "empresa") return "border-purple-100 bg-purple-50 text-purple-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ActionMessage({ state }: { state: UsuarioActionResult }) {
  if (!state.message) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-sm font-black leading-6 ${
        state.ok
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-red-100 bg-red-50 text-red-700"
      }`}
      aria-live="polite"
    >
      {state.message}
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {pending ? "Salvando..." : children}
    </button>
  );
}

function NovoUsuarioForm({
  empresas,
  estagiarios,
}: {
  empresas: UsuarioOption[];
  estagiarios: UsuarioOption[];
}) {
  const router = useRouter();
  const [role, setRole] = useState("rh_operador");
  const [state, formAction] = useActionState(criarUsuarioSistemaAction, initialActionState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-5">
      <ActionMessage state={state} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Nome</span>
          <input
            name="nome"
            required
            placeholder="Nome completo"
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">E-mail</span>
          <input
            name="email"
            type="email"
            required
            placeholder="usuario@email.com"
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Perfil</span>
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="rh_operador">RH operador</option>
            <option value="rh_master">RH master</option>
            <option value="empresa">Empresa</option>
            <option value="estagiario">Estagiário</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Senha inicial</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>
      </div>

      {role === "empresa" ? (
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Empresa vinculada</span>
          <select
            name="company_id"
            required
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="">Selecione a empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.label}
                {empresa.detail ? ` — ${empresa.detail}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {role === "estagiario" ? (
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Estagiário vinculado</span>
          <select
            name="student_id"
            required
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="">Selecione o estagiário</option>
            {estagiarios.map((estagiario) => (
              <option key={estagiario.id} value={estagiario.id}>
                {estagiario.label}
                {estagiario.detail ? ` — ${estagiario.detail}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex items-start gap-3 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
        <input
          name="must_change_password"
          type="checkbox"
          defaultChecked
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm font-bold leading-6 text-yellow-800">
          Exigir troca de senha no próximo acesso. Use essa opção quando a senha for criada pelo RH.
        </span>
      </label>

      <SubmitButton>Criar usuário</SubmitButton>
    </form>
  );
}

function SenhaForm({ usuario }: { usuario: Row }) {
  const router = useRouter();
  const [state, formAction] = useActionState(redefinirSenhaUsuarioAction, initialActionState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-5">
      <ActionMessage state={state} />

      <input type="hidden" name="id" value={getValue(usuario, ["id"])} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-blue-950">
          {getValue(usuario, ["nome"], "Usuário")}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {getValue(usuario, ["email"], "E-mail não informado")}
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Nova senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
        <input
          name="must_change_password"
          type="checkbox"
          defaultChecked
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm font-bold leading-6 text-yellow-800">
          Exigir que o usuário troque a senha no próximo acesso.
        </span>
      </label>

      <SubmitButton>Redefinir senha</SubmitButton>
    </form>
  );
}

function StatusForm({ usuario }: { usuario: Row }) {
  const router = useRouter();
  const currentStatus = getValue(usuario, ["status"], "ativo");
  const nextStatus = currentStatus === "ativo" ? "bloqueado" : "ativo";
  const [state, formAction] = useActionState(alterarStatusUsuarioAction, initialActionState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-5">
      <ActionMessage state={state} />

      <input type="hidden" name="id" value={getValue(usuario, ["id"])} />
      <input type="hidden" name="status" value={nextStatus} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-blue-950">
          {getValue(usuario, ["nome"], "Usuário")}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Status atual: {currentStatus}
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Motivo</span>
        <textarea
          name="motivo"
          rows={4}
          placeholder={
            nextStatus === "ativo"
              ? "Motivo da reativação"
              : "Motivo do bloqueio"
          }
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black text-white ${
          nextStatus === "ativo"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {nextStatus === "ativo" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        {nextStatus === "ativo" ? "Reativar usuário" : "Bloquear usuário"}
      </button>
    </form>
  );
}

export function UsuariosWorkspace({
  usuarios,
  empresas,
  estagiarios,
}: {
  usuarios: UsuarioSistema[];
  empresas: UsuarioOption[];
  estagiarios: UsuarioOption[];
}) {
  const [search, setSearch] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [senhaUsuario, setSenhaUsuario] = useState<Row | null>(null);
  const [statusUsuario, setStatusUsuario] = useState<Row | null>(null);

  const rows = usuarios as Row[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((usuario) =>
      [
        getValue(usuario, ["nome"]),
        getValue(usuario, ["email"]),
        getValue(usuario, ["role"]),
        getValue(usuario, ["status"]),
        getValue(usuario, ["company_name", "empresa_nome"]),
        getValue(usuario, ["student_name", "estagiario_nome"]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const total = rows.length;
  const ativos = rows.filter((item) => getValue(item, ["status"], "ativo") === "ativo").length;
  const bloqueados = rows.filter((item) => getValue(item, ["status"]) === "bloqueado").length;
  const rhUsers = rows.filter((item) => getValue(item, ["role"]).startsWith("rh_")).length;

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <UsersRound className="h-7 w-7 text-blue-700" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Usuários</p>
          <p className="mt-2 text-3xl font-black text-blue-950">{total}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <ShieldCheck className="h-7 w-7 text-green-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Ativos</p>
          <p className="mt-2 text-3xl font-black text-blue-950">{ativos}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <AlertTriangle className="h-7 w-7 text-red-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Bloqueados</p>
          <p className="mt-2 text-3xl font-black text-blue-950">{bloqueados}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <UserCog className="h-7 w-7 text-blue-700" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">RH</p>
          <p className="mt-2 text-3xl font-black text-blue-950">{rhUsers}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar usuário, e-mail, perfil, empresa ou estagiário"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={() => setNovoOpen(true)}
            className="btn-wisdom-red inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black"
          >
            <Plus className="h-5 w-5" />
            Novo usuário
          </button>

          <button
            type="button"
            onClick={() => setAjudaOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-blue-950 hover:bg-slate-50"
          >
            <HelpCircle className="h-5 w-5 text-blue-700" />
            Ajuda
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-7">
          <h2 className="text-2xl font-black text-blue-950">Usuários do sistema</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Criação, redefinição de senha e bloqueio de acessos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.25em] text-blue-950/70">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Vínculo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Senha</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-500">
                      Nenhum usuário encontrado.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((usuario) => {
                  const id = getValue(usuario, ["id"]);
                  const role = getValue(usuario, ["role"]);
                  const status = getValue(usuario, ["status"], "ativo");
                  const mustChangePassword =
                    Boolean(usuario.must_change_password) ||
                    Boolean(usuario["mustChangePassword"]);
                  const vinculo =
                    role === "empresa"
                      ? getValue(usuario, ["company_name", "empresa_nome"], "Empresa não vinculada")
                      : role === "estagiario"
                        ? getValue(usuario, ["student_name", "estagiario_nome"], "Estagiário não vinculado")
                        : "RH Wisdom";

                  return (
                    <tr key={id} className="rounded-2xl bg-slate-50 text-sm">
                      <td className="px-4 py-4">
                        <p className="font-black uppercase text-blue-950">
                          {getValue(usuario, ["nome"], "Usuário sem nome")}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {getValue(usuario, ["email"], "E-mail não informado")}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${roleClass(role)}`}>
                          {roleLabel(role)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-700">
                        {vinculo}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(status)}`}>
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            mustChangePassword
                              ? "border-yellow-100 bg-yellow-50 text-yellow-700"
                              : "border-green-100 bg-green-50 text-green-700"
                          }`}
                        >
                          {mustChangePassword ? "Troca obrigatória" : "Configurada"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSenhaUsuario(usuario)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white hover:bg-blue-800"
                          >
                            <KeyRound className="h-4 w-4" />
                            Senha
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusUsuario(usuario)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-blue-950 hover:bg-slate-50"
                          >
                            <UserCog className="h-4 w-4" />
                            Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo usuário"
        description="Crie o acesso com e-mail único, perfil correto e senha inicial."
        size="lg"
      >
        <NovoUsuarioForm empresas={empresas} estagiarios={estagiarios} />
      </Modal>

      <Modal
        open={Boolean(senhaUsuario)}
        onClose={() => setSenhaUsuario(null)}
        title="Redefinir senha"
        description="Defina uma nova senha inicial para o usuário."
        size="md"
      >
        {senhaUsuario ? <SenhaForm usuario={senhaUsuario} /> : null}
      </Modal>

      <Modal
        open={Boolean(statusUsuario)}
        onClose={() => setStatusUsuario(null)}
        title="Alterar status"
        description="Bloqueie ou reative o acesso do usuário."
        size="md"
      >
        {statusUsuario ? <StatusForm usuario={statusUsuario} /> : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de usuários"
        description="Regras de segurança para criação de acessos."
        size="md"
      >
        <div className="space-y-4 text-sm font-bold leading-7 text-slate-600">
          <p>
            Cada usuário precisa ter um e-mail único. Se o e-mail já estiver em uso,
            o sistema agora informa o motivo do bloqueio do cadastro.
          </p>
          <p>
            Use <strong>RH master</strong> somente para quem pode administrar o sistema.
            Use <strong>RH operador</strong> para operação diária.
          </p>
          <p>
            O botão <strong>Sair</strong> no menu lateral encerra a sessão e evita que outra pessoa use o sistema com o acesso aberto.
          </p>
        </div>
      </Modal>
    </section>
  );
}