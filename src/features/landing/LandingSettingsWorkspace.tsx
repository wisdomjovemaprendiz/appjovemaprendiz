"use client";

import type { LandingMedia, LandingSettings, LandingUpdate } from "@/data/rh/landing.data";
import {
  Archive,
  CheckCircle2,
  Eye,
  ImagePlus,
  Camera,
  Loader2,
  PlayCircle,
  Save,
  UploadCloud,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Tab = "conteudo" | "links" | "video" | "imagens" | "atualizacoes" | "preview";

function messageClass(ok: boolean) {
  return ok
    ? "border-green-100 bg-green-50 text-green-700"
    : "border-red-100 bg-red-50 text-red-700";
}

function formatBytes(value: number | null | undefined) {
  const size = Number(value ?? 0);
  if (!Number.isFinite(size) || size <= 0) return "Tamanho não informado";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryLabel(value: string) {
  if (value === "hero") return "Destaque";
  if (value === "empresas") return "Empresas";
  if (value === "depoimentos") return "Depoimentos";
  if (value === "instagram") return "Instagram";
  return "Galeria";
}

function HiddenSettingsFields({ settings, includeVideo = true }: { settings: LandingSettings; includeVideo?: boolean }) {
  return (
    <>
      <input type="hidden" name="public_enabled" value={settings.public_enabled ? "true" : "false"} />
      <input type="hidden" name="hero_badge" value={settings.hero_badge || ""} />
      <input type="hidden" name="hero_title" value={settings.hero_title || ""} />
      <input type="hidden" name="hero_subtitle" value={settings.hero_subtitle || ""} />
      <input type="hidden" name="primary_cta_label" value={settings.primary_cta_label || ""} />
      <input type="hidden" name="primary_cta_url" value={settings.primary_cta_url || ""} />
      <input type="hidden" name="secondary_cta_label" value={settings.secondary_cta_label || ""} />
      <input type="hidden" name="secondary_cta_url" value={settings.secondary_cta_url || ""} />
      {includeVideo ? <input type="hidden" name="video_url" value={settings.video_url || ""} /> : null}
      <input type="hidden" name="company_section_title" value={settings.company_section_title || ""} />
      <input type="hidden" name="company_section_text" value={settings.company_section_text || ""} />
      <input type="hidden" name="instagram_url" value={settings.instagram_url || ""} />
      <input type="hidden" name="whatsapp_url" value={settings.whatsapp_url || ""} />
      <input type="hidden" name="rh_login_url" value={settings.rh_login_url || ""} />
      <input type="hidden" name="empresa_portal_url" value={settings.empresa_portal_url || ""} />
      <input type="hidden" name="estagiario_portal_url" value={settings.estagiario_portal_url || ""} />
      <input type="hidden" name="empresa_cadastro_url" value={settings.empresa_cadastro_url || ""} />
      <input type="hidden" name="facts_section_title" value={settings.facts_section_title || ""} />
      <input type="hidden" name="facts_section_text" value={settings.facts_section_text || ""} />
    </>
  );
}

export function LandingSettingsWorkspace({
  initialSettings,
  initialMedia,
  initialUpdates,
}: {
  initialSettings: LandingSettings;
  initialMedia: LandingMedia[];
  initialUpdates: LandingUpdate[];
}) {
  const [tab, setTab] = useState<Tab>("conteudo");
  const [settings, setSettings] = useState<LandingSettings>(initialSettings);
  const [media, setMedia] = useState<LandingMedia[]>(initialMedia);
  const [updates, setUpdates] = useState<LandingUpdate[]>(initialUpdates);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const activeMedia = useMemo(
    () => media.filter((item) => item.status === "ativo"),
    [media]
  );

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch("/api/rh/landing/config", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setSettings(result.data);
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao salvar configurações.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch("/api/rh/landing/media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setMedia((current) => [result.data, ...current]);
        event.currentTarget.reset();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao enviar imagem.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function createUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch("/api/rh/landing/updates", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setUpdates((current) => [result.data, ...current]);
        event.currentTarget.reset();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao cadastrar atualização.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateMedia(id: string, payload: Record<string, unknown>) {
    setMessage(null);

    const response = await fetch("/api/rh/landing/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });

    const result = await response.json();

    setMessage({
      ok: Boolean(result.ok),
      text: result.message || "Resposta recebida.",
    });

    if (result.ok) {
      setMedia((current) => current.map((item) => (item.id === id ? result.data : item)));
    }
  }

  async function updatePost(id: string, payload: Record<string, unknown>) {
    setMessage(null);

    const response = await fetch("/api/rh/landing/updates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });

    const result = await response.json();

    setMessage({
      ok: Boolean(result.ok),
      text: result.message || "Resposta recebida.",
    });

    if (result.ok) {
      setUpdates((current) => current.map((item) => (item.id === id ? result.data : item)));
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "conteudo", label: "Conteúdo" },
    { id: "links", label: "Links e acessos" },
    { id: "video", label: "Vídeo" },
    { id: "imagens", label: "Fotos" },
    { id: "atualizacoes", label: "Atualizações" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      {message ? (
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-black ${messageClass(message.ok)}`}>
          {message.text}
        </div>
      ) : null}

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-14 flex-1 shrink-0 items-center justify-center rounded-xl px-5 py-3 text-base font-black ${
                tab === item.id
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-500 hover:text-blue-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "conteudo" ? (
        <form onSubmit={saveSettings} className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-blue-950">Conteúdo da landing</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Edite os principais textos, CTAs e a seção informativa sobre estágio.
            </p>
          </div>

          <HiddenSettingsFields settings={settings} />

          <div className="grid gap-5">
            <label className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <input
                type="checkbox"
                name="public_enabled"
                value="true"
                defaultChecked={settings.public_enabled}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm font-bold leading-6 text-blue-900">
                Landing page publicada.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Selo superior</span>
              <input name="hero_badge" defaultValue={settings.hero_badge || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Título principal</span>
              <input name="hero_title" defaultValue={settings.hero_title || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Subtítulo principal</span>
              <textarea name="hero_subtitle" rows={4} defaultValue={settings.hero_subtitle || ""} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Botão principal</span>
                <input name="primary_cta_label" defaultValue={settings.primary_cta_label || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Link do botão principal</span>
                <input name="primary_cta_url" defaultValue={settings.primary_cta_url || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Botão secundário</span>
                <input name="secondary_cta_label" defaultValue={settings.secondary_cta_label || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Link do botão secundário</span>
                <input name="secondary_cta_url" defaultValue={settings.secondary_cta_url || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Título da seção empresas</span>
              <input name="company_section_title" defaultValue={settings.company_section_title || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Texto da seção empresas</span>
              <textarea name="company_section_text" rows={4} defaultValue={settings.company_section_text || ""} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Título da seção dúvidas/fatos</span>
              <input name="facts_section_title" defaultValue={settings.facts_section_title || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Texto da seção dúvidas/fatos</span>
              <textarea name="facts_section_text" rows={4} defaultValue={settings.facts_section_text || ""} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
            </label>

            <button type="submit" disabled={saving} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Salvando..." : "Salvar conteúdo"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "links" ? (
        <form onSubmit={saveSettings} className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-blue-950">Links e acessos</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Configure Instagram, WhatsApp e botões de acesso para RH, empresa e estagiário.
            </p>
          </div>

          <HiddenSettingsFields settings={settings} />

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Instagram</span>
                <input name="instagram_url" defaultValue={settings.instagram_url || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">WhatsApp</span>
                <input name="whatsapp_url" defaultValue={settings.whatsapp_url || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Login RH/Admin</span>
                <input name="rh_login_url" defaultValue={settings.rh_login_url || "/login"} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Cadastro da empresa</span>
                <input name="empresa_cadastro_url" defaultValue={settings.empresa_cadastro_url || "/empresa/cadastro"} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Portal da empresa</span>
                <input name="empresa_portal_url" defaultValue={settings.empresa_portal_url || "/empresa"} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Portal do estagiário</span>
                <input name="estagiario_portal_url" defaultValue={settings.estagiario_portal_url || "/estagiario"} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Salvando..." : "Salvar links"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "video" ? (
        <form onSubmit={saveSettings} className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <PlayCircle className="h-8 w-8 text-blue-700" />
            <div>
              <h2 className="text-2xl font-black text-blue-950">Vídeo da landing page</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Cole o link do YouTube ou Vimeo.</p>
            </div>
          </div>

          <HiddenSettingsFields settings={settings} includeVideo={false} />

          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Link do vídeo</span>
              <input name="video_url" defaultValue={settings.video_url || ""} placeholder="https://www.youtube.com/watch?v=..." className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
            </label>

            {settings.video_embed_url ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                <iframe src={settings.video_embed_url} title="Preview do vídeo" className="aspect-video w-full" allowFullScreen />
              </div>
            ) : null}

            <button type="submit" disabled={saving} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Salvando..." : "Salvar vídeo"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "imagens" ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={uploadImage} className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <ImagePlus className="h-8 w-8 text-blue-700" />
              <div>
                <h2 className="text-2xl font-black text-blue-950">Enviar foto</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">As fotos aparecem na landing pública.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Categoria</span>
                <select name="category" defaultValue="galeria" className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500">
                  <option value="hero">Destaque</option>
                  <option value="galeria">Galeria</option>
                  <option value="empresas">Empresas</option>
                  <option value="depoimentos">Depoimentos</option>
                  <option value="instagram">Instagram</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Título</span>
                <input name="title" className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Descrição</span>
                <textarea name="description" rows={3} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Ordem</span>
                <input type="number" name="sort_order" defaultValue="0" className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Imagem</span>
                <input type="file" name="file" required accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-blue-700" />
              </label>

              <button type="submit" disabled={uploading} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                {uploading ? "Enviando..." : "Enviar imagem"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-blue-950">Fotos cadastradas</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Fotos ativas aparecem na landing pública.</p>

            {media.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-blue-700" />
                <p className="mt-3 font-black text-blue-950">Nenhuma foto cadastrada.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {media.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    {item.public_url ? (
                      <img src={item.public_url} alt={item.title || item.original_name || "Imagem"} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-slate-200 text-sm font-black text-slate-500">Sem preview</div>
                    )}

                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-blue-950">{item.title || item.original_name || "Imagem sem título"}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{categoryLabel(item.category)} • {formatBytes(item.file_size)}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${item.status === "ativo" ? "border-green-100 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.web_view_link ? (
                          <a href={item.web_view_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                            Abrir
                          </a>
                        ) : null}

                        {item.status === "ativo" ? (
                          <button type="button" onClick={() => updateMedia(item.id, { status: "arquivado" })} className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                            <Archive className="h-4 w-4" />
                            Arquivar
                          </button>
                        ) : (
                          <button type="button" onClick={() => updateMedia(item.id, { status: "ativo" })} className="inline-flex items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-700 hover:bg-green-50">
                            <CheckCircle2 className="h-4 w-4" />
                            Ativar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "atualizacoes" ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={createUpdate} className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Camera className="h-8 w-8 text-red-600" />
              <div>
                <h2 className="text-2xl font-black text-blue-950">Atualização manual</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Cadastre links de posts do Instagram ou outras novidades.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Título</span>
                <input name="title" required className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Descrição</span>
                <textarea name="description" rows={3} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">URL da postagem</span>
                <input name="post_url" required placeholder="https://www.instagram.com/p/..." className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">URL de imagem opcional</span>
                <input name="image_url" placeholder="Pode usar uma imagem da galeria ou deixar vazio" className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-blue-950">Selo</span>
                  <input name="badge" defaultValue="Instagram" className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-blue-950">Ordem</span>
                  <input type="number" name="sort_order" defaultValue="0" className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
                </label>
              </div>

              <button type="submit" disabled={saving} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? "Salvando..." : "Cadastrar atualização"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-blue-950">Atualizações cadastradas</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Apenas atualizações ativas aparecem na landing pública.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {updates.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-blue-950">{item.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{item.badge || "Instagram"}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${item.status === "ativo" ? "border-green-100 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                      {item.status}
                    </span>
                  </div>

                  {item.description ? (
                    <p className="text-sm font-semibold leading-6 text-slate-600">{item.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={item.post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                      Abrir
                    </a>

                    {item.status === "ativo" ? (
                      <button type="button" onClick={() => updatePost(item.id, { status: "arquivado" })} className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </button>
                    ) : (
                      <button type="button" onClick={() => updatePost(item.id, { status: "ativo" })} className="inline-flex items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-700 hover:bg-green-50">
                        <CheckCircle2 className="h-4 w-4" />
                        Ativar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "preview" ? (
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black text-blue-950">Preview rápido</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Abra a página pública para conferir a experiência completa.
          </p>

          <div className="mt-6 rounded-[2rem] bg-blue-950 p-8 text-white">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">{settings.hero_badge}</p>
            <h3 className="mt-3 max-w-3xl text-4xl font-black">{settings.hero_title}</h3>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-blue-100">{settings.hero_subtitle}</p>
          </div>

          {activeMedia.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {activeMedia.slice(0, 6).map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl bg-slate-100">
                  {item.public_url ? <img src={item.public_url} alt={item.title || "Imagem"} className="h-40 w-full object-cover" /> : null}
                  <div className="p-4">
                    <p className="font-black text-blue-950">{item.title || categoryLabel(item.category)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <a href="/" target="_blank" rel="noreferrer" className="btn-wisdom-blue mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black">
            <Eye className="h-5 w-5" />
            Abrir landing pública
          </a>
        </section>
      ) : null}
    </section>
  );
}