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

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.RH_MASTER_EMAIL;
const password = process.env.RH_MASTER_PASSWORD || "Wizard";
const nome = process.env.RH_MASTER_NAME || "Administrador RH";

if (!supabaseUrl || !serviceKey) {
  console.error("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

if (!email) {
  console.error("Preencha RH_MASTER_EMAIL no .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error(`Erro ao listar usuários: ${listError.message}`);
  process.exit(1);
}

let user = usersData.users.find(
  (item) => item.email?.toLowerCase() === email.toLowerCase()
);

if (!user) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role: "rh_master",
    },
  });

  if (createError || !created.user) {
    console.error(`Erro ao criar RH master: ${createError?.message || "usuário não retornado"}`);
    process.exit(1);
  }

  user = created.user;
  console.log(`Usuário RH master criado: ${email}`);
} else {
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role: "rh_master",
    },
  });

  if (updateError) {
    console.error(`Erro ao atualizar senha inicial: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`Usuário RH master já existia. Senha inicial atualizada: ${email}`);
}

const profilePayload = {
  id: user.id,
  email,
  nome,
  role: "rh_master",
  status: "ativo",
  company_id: null,
  student_id: null,
  must_change_password: true,
  created_by: user.id,
  updated_at: new Date().toISOString(),
};

const { error: profileError } = await supabase
  .from("app_profiles")
  .upsert(profilePayload, { onConflict: "id" });

if (profileError) {
  console.error(`Erro ao salvar perfil RH master: ${profileError.message}`);
  process.exit(1);
}

console.log("Perfil RH master configurado com sucesso.");
console.log(`Login: ${email}`);
console.log(`Senha inicial temporária: ${password}`);
console.log("No primeiro acesso, o sistema exigirá troca de senha.");