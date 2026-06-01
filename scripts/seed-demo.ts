/**
 * Creates a demo Supabase user for local / staging trials.
 *   email:    demo@hsk.local
 *   password: Demo1234
 *   level:    3 (HSK 1–3)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run db:seed
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  const email = "demo@hsk.local";
  const password = "Demo1234";
  const username = "demo";
  const supabase = admin();

  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);

  let userId = existing?.id;
  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Created Supabase user", email);
  } else {
    await supabase.auth.admin.updateUserById(existing.id, { password });
    console.log("Updated password for", email);
  }

  if (userId) {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username,
      member_level: 3,
    });
    if (error) throw error;
  }

  console.log(`Demo account → ${email} / ${password} (member_level 3)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
