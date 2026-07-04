import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

async function loadLocalEnvironment() {
  try {
    const raw = await readFile(resolve(".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
      const separator = line.indexOf("=");
      const name = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[name]) process.env[name] = value;
    }
  } catch {
    // En CI/Vercel las variables se reciben del entorno y no existe .env.local.
  }
}

async function main() {
  await loadLocalEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");

  const local = (await readdir(resolve("supabase/migrations")))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .map((name) => name.match(/^(\d+)/)?.[1])
    .filter(Boolean);

  const response = await fetch(`${url}/rest/v1/schema_migrations?select=version`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "supabase_migrations" },
  });
  if (!response.ok) {
    throw new Error(`No se pudo leer supabase_migrations.schema_migrations: HTTP ${response.status}. Verifica el proyecto y los permisos.`);
  }
  const remote = new Set(((await response.json()) as Array<{ version: string }>).map((row) => String(row.version).padStart(3, "0")));
  const missing = local.filter((version) => !remote.has(String(version).padStart(3, "0")));
  console.log(`Migraciones: ${local.length - missing.length}/${local.length} aplicadas.`);
  if (missing.length) {
    console.error(`Pendientes: ${missing.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
