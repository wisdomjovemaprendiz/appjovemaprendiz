"use client";

import { StudentAvatar } from "@/components/ui/StudentAvatar";
import { Building2, KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type EntityType = "empresa" | "estagiario";

type AccessResponse = {
  entity?: {
    id: string;
    nome: string;
    email: string;
    auth_user_id: string | null;
    senha_configurada_em: string | null;
    foto_url?: string | null;
  };
  profile?: {
    id: string;
    email: string;
    nome: string;
    role: string;
    status: string;
    must_change_password: boolean;
  } | null;
  role?: string;
  has_access?: boolean;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Ainda não configurada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EntityAccessCard({
  entityType,
  entityId,
  title,
  description,
}: {
  entityType: EntityType;
  entityId: string | null;
  title: string;
  description: string;
}) {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const hasAccess = Boolean(data?.has_access || data?.profile);

  const roleLabel = useMemo(() => {
    if (entityType === "empresa") return "Portal da empresa";
    return "Portal do estagiário";
  }, [entityType]);

  async function loadAccess() {
    if (!entityId) return;

    setFetching(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/rh/usuarios/acesso-vinculado?entity_type=${entityType}&entity_id=${entityId}`
      );

      const result = await response.json();

      if (result.ok) {
        setData(result.data);
        setNome(result.data.profile?.nome || result.data.entity?.nome || "");
        setEmail(result.data.profile?.email || result.data.entity?.email || "");
        setMustChangePassword(
          result.data.profile?.must_change_password === undefined
            ? true
            : Boolean(result.data.profile?.must_change_password)
        );
      } else {
        setMessage({
          ok: false,
          text: result.message || "Erro ao carregar acesso.",
        });
      }
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar acesso.",
      });
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!entityId) {
      setMessage({
        ok: false,
        text: "Salve o cadastro antes de criar o acesso.",
      });
      return;
    }

    if (!nome || !email) {
      setMessage({
        ok: false,
        text: "Nome e e-mail são obrigatórios.",
      });
      return;
    }

    if (!hasAccess && password.length < 6) {
      setMessage({
        ok: false,
        text: "Informe uma senha inicial com pelo menos 6 caracteres.",
      });
      return;
    }

    if (hasAccess && password && password.length < 6) {
      setMessage({
        ok: false,
        text: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("entity_type", entityType);
      formData.set("entity_id", entityId);
      formData.set("nome", nome);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("must_change_password", mustChangePassword ? "true" : "false");

      const response = await fetch("/api/rh/usuarios/acesso-vinculado", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setPassword("");
        await loadAccess();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar acesso.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3">
          <ShieldCheck className="h-7 w-7 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-950">{title}</h2>
          <p className="text-sm font-semibold text-slate-500">{description}</p>
        </div>
      </div>

      {!entityId ? (
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
          Salve o cadastro para liberar a criação do acesso.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {message ? (
            <div
              className={`rounded-2xl border p-4 text-sm font-black ${
                message.ok
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {entityType === "estagiario" ? (
                <StudentAvatar
                  name={data?.entity?.nome || nome}
                  photoUrl={data?.entity?.foto_url}
                  size="md"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-800" />
                </div>
              )}

              <div>
                <p className="font-black text-blue-950">
                  {data?.entity?.nome || nome || "Cadastro vinculado"}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {roleLabel} • {hasAccess ? "acesso criado" : "sem acesso"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Status
                </p>
                <p className="mt-1 font-black text-blue-950">
                  {data?.profile?.status || "sem acesso"}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Senha
                </p>
                <p className="mt-1 font-black text-blue-950">
                  {data?.profile?.must_change_password
                    ? "troca obrigatória"
                    : hasAccess
                      ? "configurada"
                      : "não criada"}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Configurada em
                </p>
                <p className="mt-1 font-black text-blue-950">
                  {formatDateTime(data?.entity?.senha_configurada_em)}
                </p>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando acesso...
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Nome de acesso
              </span>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                E-mail de login
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">
              {hasAccess ? "Nova senha" : "Senha inicial"}
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  hasAccess
                    ? "Preencha somente se desejar redefinir"
                    : "Mínimo 6 caracteres"
                }
                required={!hasAccess}
                minLength={hasAccess && !password ? undefined : 6}
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <input
              type="checkbox"
              checked={mustChangePassword}
              onChange={(event) => setMustChangePassword(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm font-bold leading-6 text-yellow-800">
              Exigir que o usuário troque a senha no próximo acesso.
              Use essa opção quando a senha for criada pelo RH.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || fetching}
            className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {loading
              ? "Salvando..."
              : hasAccess
                ? "Atualizar acesso"
                : "Criar acesso"}
          </button>
        </form>
      )}
    </section>
  );
}