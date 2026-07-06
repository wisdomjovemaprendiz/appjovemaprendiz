"use client";

import { useMemo, useState } from "react";
import {
  alterarStatusUsuarioAction,
  criarUsuarioSistemaAction,
  redefinirSenhaUsuarioAction,
} from "@/actions/rh/usuario.actions";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import type { UsuarioOption, UsuarioSistema } from "@/data/rh/usuarios.data";
import {
  Building2,
  GraduationCap,
  HelpCircle,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

function roleLabel(role: string) {
  if (role === "rh_master") return "RH master";
  if (role === "rh_operador") return "RH operador";
  if (role === "empresa") return "Empresa";
  if (role === "estagiario") return "Estagiário";
  return role;
}

function statusTone(status: string): "ok" | "warning" | "danger" | "info" | "muted" {
  if (status === "ativo") return "ok";
  if (status === "bloqueado") return "danger";
  return "muted";
}

function NovoUsuarioForm({
  empresas,
  estagiarios,
}: {
  empresas: UsuarioOption[];
  estagiarios: UsuarioOption[];
}) {
  const [role, setRole] = useState("rh_operador");

  return (
    <form action={async (formData) => { await criarUsuarioSistemaAction(formData); }} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Nome</span>
          <input
            name="nome"
            required
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">E-mail</span>
          <input
            type="email"
            name="email"
            required
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
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
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
            type="password"
            name="password"
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
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="">Selecione</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.label}
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
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="">Selecione</option>
            {estagiarios.map((estagiario) => (
              <option key={estagiario.id} value={estagiario.id}>
                {estagiario.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-bold leading-6 text-yellow-800">
        O usuário será obrigado a trocar a senha no primeiro acesso.
      </div>

      <button
        type="submit"
        className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
      >
        <Plus className="h-5 w-5" />
        Criar usuário
      </button>
    </form>
  );
}

function ResetSenhaForm({ user }: { user: UsuarioSistema }) {
  return (
    <form action={async (formData) => { await redefinirSenhaUsuarioAction(formData); }} className="space-y-5">
      <input type="hidden" name="id" value={user.id} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-500">Usuário</p>
        <p className="mt-1 font-black text-blue-950">{user.nome}</p>
        <p className="text-sm font-semibold text-slate-500">{user.email}</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Nova senha</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
      >
        <KeyRound className="h-5 w-5" />
        Redefinir senha
      </button>
    </form>
  );
}

function StatusUsuarioForm({ user }: { user: UsuarioSistema }) {
  return (
    <form action={async (formData) => { await alterarStatusUsuarioAction(formData); }} className="space-y-5">
      <input type="hidden" name="id" value={user.id} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-500">Usuário</p>
        <p className="mt-1 font-black text-blue-950">{user.nome}</p>
        <p className="text-sm font-semibold text-slate-500">{user.email}</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Status</span>
        <select
          name="status"
          defaultValue={user.status}
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Motivo</span>
        <textarea
          name="motivo"
          required
          rows={4}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className="btn-wisdom-blue inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
      >
        <ShieldCheck className="h-5 w-5" />
        Alterar status
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
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UsuarioSistema | null>(null);
  const [statusUser, setStatusUser] = useState<UsuarioSistema | null>(null);
  const [search, setSearch] = useState("");

  const rhUsers = usuarios.filter((user) => user.role === "rh_master" || user.role === "rh_operador");
  const empresaUsers = usuarios.filter((user) => user.role === "empresa");
  const estagiarioUsers = usuarios.filter((user) => user.role === "estagiario");
  const ativos = usuarios.filter((user) => user.status === "ativo");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return usuarios;

    return usuarios.filter((user) =>
      [
        user.nome,
        user.email,
        user.role,
        user.status,
        user.company_name,
        user.student_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [usuarios, search]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="h-7 w-7" />}
          label="Usuários"
          value={String(usuarios.length)}
        />
        <MetricCard
          icon={<ShieldCheck className="h-7 w-7 text-blue-700" />}
          label="RH"
          value={String(rhUsers.length)}
        />
        <MetricCard
          icon={<Building2 className="h-7 w-7" />}
          label="Empresas"
          value={String(empresaUsers.length)}
        />
        <MetricCard
          icon={<GraduationCap className="h-7 w-7" />}
          label="Estagiários"
          value={String(estagiarioUsers.length)}
          helper={`${ativos.length} ativo(s)`}
        />
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar usuário, e-mail, perfil, empresa ou estagiário"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setNovoOpen(true)}
            className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
          >
            <Plus className="h-5 w-5" />
            Novo usuário
          </button>

          <button
            type="button"
            onClick={() => setAjudaOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-blue-950 hover:bg-slate-50"
          >
            <HelpCircle className="h-5 w-5 text-blue-700" />
            Ajuda
          </button>
        </div>
      </div>

      <TableShell
        title="Usuários do sistema"
        description="Criação, redefinição de senha e bloqueio de acessos."
      >
        {filtered.length === 0 ? (
          <EmptyTable
            title="Nenhum usuário encontrado."
            description="Crie o primeiro usuário pelo botão Novo usuário."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">Usuário</th>
                  <th className="px-4 py-2">Perfil</th>
                  <th className="px-4 py-2">Vínculo</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Senha</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="bg-slate-50">
                    <td className="rounded-l-2xl px-4 py-4">
                      <p className="font-black text-blue-950">{user.nome}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {user.email}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill tone="info">{roleLabel(user.role)}</StatusPill>
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-700">
                      {user.company_name || user.student_name || "RH Wisdom"}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill tone={statusTone(user.status)}>
                        {user.status}
                      </StatusPill>
                    </td>

                    <td className="px-4 py-4">
                      {user.must_change_password ? (
                        <StatusPill tone="warning">Troca obrigatória</StatusPill>
                      ) : (
                        <StatusPill tone="ok">Configurada</StatusPill>
                      )}
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setResetUser(user)}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                        >
                          <KeyRound className="h-4 w-4" />
                          Senha
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatusUser(user)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-blue-950 hover:bg-slate-50"
                        >
                          <UserCog className="h-4 w-4" />
                          Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableShell>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo usuário"
        description="Crie acesso para RH, empresa ou estagiário."
        size="lg"
      >
        <NovoUsuarioForm empresas={empresas} estagiarios={estagiarios} />
      </Modal>

      <Modal
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        title="Redefinir senha"
        description="A nova senha será temporária e exigirá troca no próximo acesso."
        size="md"
      >
        {resetUser ? <ResetSenhaForm user={resetUser} /> : null}
      </Modal>

      <Modal
        open={Boolean(statusUser)}
        onClose={() => setStatusUser(null)}
        title="Alterar status do usuário"
        description="Bloqueie, inative ou reative o acesso."
        size="md"
      >
        {statusUser ? <StatusUsuarioForm user={statusUser} /> : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de usuários"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            O RH master pode criar usuários para operadores, empresas e
            estagiários.
          </p>
          <p>
            Toda senha criada pelo RH é temporária. O usuário será obrigado a
            trocar no primeiro acesso.
          </p>
          <p>
            Use <strong>Status</strong> para bloquear ou inativar acessos sem
            excluir o histórico.
          </p>
        </div>
      </Modal>
    </section>
  );
}