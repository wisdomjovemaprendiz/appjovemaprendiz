"use client";

import { StudentAvatar } from "@/components/ui/StudentAvatar";
import { Camera, ImagePlus, Loader2, Save } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type PhotoState = {
  foto_url: string | null;
  foto_file_name: string | null;
  foto_atualizada_em: string | null;
  nome?: string | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function compressImage(file: File): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = URL.createObjectURL(file);
  });

  const maxSize = 900;
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível preparar a compressão da foto.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível comprimir a foto."));
      },
      "image/jpeg",
      0.72
    );
  });

  URL.revokeObjectURL(image.src);

  return new File([blob], "foto-estagiario.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function EstagiarioPhotoCard({
  estagiarioId,
}: {
  estagiarioId: string | null;
}) {
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedInfo, setCompressedInfo] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!estagiarioId) return;

    let active = true;

    async function loadPhoto() {
      setFetching(true);

      try {
        const response = await fetch(`/api/rh/estagiarios/foto?estagiario_id=${estagiarioId}`);
        const result = await response.json();

        if (active && result.ok) {
          setPhoto(result.data);
        }
      } finally {
        if (active) setFetching(false);
      }
    }

    loadPhoto();

    return () => {
      active = false;
    };
  }, [estagiarioId]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setMessage(null);
    setSelected(null);
    setCompressedInfo(null);

    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMessage({
        ok: false,
        text: "Selecione uma imagem em JPEG ou PNG.",
      });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setSelected(compressed);
      setPreview(URL.createObjectURL(compressed));
      setCompressedInfo(
        `Imagem comprimida: ${formatBytes(file.size)} → ${formatBytes(compressed.size)}`
      );
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Erro ao comprimir imagem.",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!estagiarioId) {
      setMessage({
        ok: false,
        text: "Salve o cadastro do estagiário antes de enviar a foto.",
      });
      return;
    }

    if (!selected) {
      setMessage({
        ok: false,
        text: "Selecione uma foto.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("estagiario_id", estagiarioId);
      formData.set("foto", selected);

      const response = await fetch("/api/rh/estagiarios/foto", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setPhoto({
          foto_url: result.data?.foto_url ?? null,
          foto_file_name: result.data?.foto_file_name ?? null,
          foto_atualizada_em: result.data?.foto_atualizada_em ?? null,
        });
        setSelected(null);
        setCompressedInfo(null);

        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      }
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao enviar foto.",
      });
    } finally {
      setLoading(false);
    }
  }

  const currentUrl = preview || photo?.foto_url || null;

  return (
    <section className="rounded-3xl bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3">
          <Camera className="h-7 w-7 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-950">
            Foto do estagiário
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            A imagem será comprimida e salva no Google Drive.
          </p>
        </div>
      </div>

      {!estagiarioId ? (
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
          Salve o cadastro para liberar o envio da foto.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
            {fetching ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
              </div>
            ) : (
              <StudentAvatar
                name={photo?.nome || "Estagiário"}
                photoUrl={currentUrl}
                size="lg"
              />
            )}

            <p className="max-w-full truncate text-center text-xs font-bold text-slate-500">
              {photo?.foto_file_name || "Sem foto cadastrada"}
            </p>
          </div>

          <div className="space-y-4">
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

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Selecionar foto
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleFileChange}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-blue-700"
              />
              <span className="text-xs font-bold text-slate-500">
                Formatos aceitos: JPEG ou PNG. A imagem será reduzida para até 900px e convertida para JPEG.
              </span>
            </label>

            {compressedInfo ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-800">
                {compressedInfo}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !selected}
              className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {loading ? "Enviando..." : "Salvar foto"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}