import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function protectedImageUrl(fileId) {
  return `/api/rh/files/image?file_id=${encodeURIComponent(fileId)}`;
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: docs, error } = await supabase
  .from("documents")
  .select("id, entity_id, drive_file_id, file_name, created_at")
  .eq("entity_type", "estagiario")
  .eq("category", "foto_estagiario")
  .eq("status", "ativo")
  .not("drive_file_id", "is", null)
  .order("created_at", { ascending: false });

if (error) {
  console.error(`Erro ao buscar documentos de foto: ${error.message}`);
  process.exit(1);
}

const latestByStudent = new Map();

for (const doc of docs ?? []) {
  if (!doc.entity_id || !doc.drive_file_id) continue;

  if (!latestByStudent.has(doc.entity_id)) {
    latestByStudent.set(doc.entity_id, doc);
  }
}

let updated = 0;

for (const [studentId, doc] of latestByStudent.entries()) {
  const payload = {
    foto_document_id: doc.id,
    foto_url: protectedImageUrl(doc.drive_file_id),
    foto_file_name: doc.file_name,
    foto_atualizada_em: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("students")
    .update(payload)
    .eq("id", studentId);

  if (updateError) {
    console.error(`Erro ao atualizar estudante ${studentId}: ${updateError.message}`);
  } else {
    updated += 1;
  }
}

console.log(`${updated} foto(s) de estagiário reparada(s).`);
console.log("Reparo finalizado.");