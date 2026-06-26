import Link from "next/link";
import {
  ImagePlus,
  Camera,
  Link2,
  Save,
  Settings,
  Video,
} from "lucide-react";

export default function AdminLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-600">
              Administração
            </p>
            <h1 className="text-3xl font-black text-blue-950">
              Configurações da landing page
            </h1>
            <p className="mt-2 text-slate-600">
              Área preparada para trocar logo, imagens, vídeos, carrossel e links sociais.
            </p>
          </div>

          <Link
            href="/rh"
            className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center font-black text-blue-950 hover:bg-blue-50"
          >
            Voltar ao painel RH
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-700" />
            <h2 className="text-2xl font-black text-blue-950">
              Identidade visual
            </h2>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block font-bold text-slate-700">
                Logomarca principal
              </span>
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
                <ImagePlus className="mx-auto mb-3 h-10 w-10 text-blue-700" />
                <p className="font-bold text-blue-950">
                  Upload da logomarca será conectado ao Supabase Storage ou Google Drive.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Por enquanto, use public/logo-wisdom.png.
                </p>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block font-bold text-slate-700">
                Título principal da página
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                defaultValue="Sua empresa precisa de estagiários? A Wisdom cuida do caminho."
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-bold text-slate-700">
                Subtítulo principal
              </span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                defaultValue="Recrutamento, triagem, encaminhamento, contrato, documentação e acompanhamento administrativo para empresas que desejam contratar estagiários."
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Video className="h-8 w-8 text-red-600" />
            <h2 className="text-2xl font-black text-blue-950">
              Vídeo institucional
            </h2>
          </div>

          <label className="block">
            <span className="mb-2 block font-bold text-slate-700">
              URL do vídeo do YouTube
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <div className="mt-6 aspect-video rounded-2xl bg-slate-950 p-4 text-white">
            <div className="flex h-full items-center justify-center rounded-xl border border-white/10 text-center">
              <div>
                <Video className="mx-auto mb-3 h-12 w-12 text-red-400" />
                <p className="font-black">Prévia do vídeo</p>
                <p className="mt-2 text-sm text-slate-300">
                  A incorporação automática será ativada quando conectarmos o banco.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Camera className="h-8 w-8 text-pink-600" />
            <h2 className="text-2xl font-black text-blue-950">
              Instagram
            </h2>
          </div>

          <label className="block">
            <span className="mb-2 block font-bold text-slate-700">
              URL do perfil
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              defaultValue="https://www.instagram.com/institutowisdom/"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block font-bold text-slate-700">
              Token/API futura do Instagram
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Será usado quando ativarmos a integração oficial"
            />
          </label>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ImagePlus className="h-8 w-8 text-blue-700" />
            <h2 className="text-2xl font-black text-blue-950">
              Carrossel de fotos
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-center">
                <ImagePlus className="mx-auto mb-3 h-9 w-9 text-blue-700" />
                <p className="font-black text-blue-950">Foto {item}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Upload será integrado ao banco.
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <Link2 className="h-8 w-8 text-yellow-700" />
            <h2 className="text-2xl font-black text-blue-950">
              Links e chamadas
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-bold text-slate-700">
                Link do WhatsApp
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                defaultValue="https://wa.me/5571985486088"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-bold text-slate-700">
                Texto do botão principal
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                defaultValue="Quero contratar estagiários"
              />
            </label>
          </div>

          <button className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-black text-white hover:bg-blue-800">
            <Save className="h-5 w-5" />
            Salvar alterações
          </button>
        </div>
      </section>
    </main>
  );
}

