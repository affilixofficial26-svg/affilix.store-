export type SupabaseHealth = {
  ready: boolean;
  latencyMs: number;
  errors: string[];
};

export async function checkSupabaseHealth(timeoutMs = 5_000): Promise<SupabaseHealth> {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ready: false, latencyMs: Date.now() - startedAt, errors: ["Faltan las variables de Supabase."] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/rest/v1/catalog_items?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ready: false, latencyMs: Date.now() - startedAt, errors: [`Supabase respondió HTTP ${response.status}.`] };
    }
    return { ready: true, latencyMs: Date.now() - startedAt, errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Health] Supabase no responde", { message });
    return { ready: false, latencyMs: Date.now() - startedAt, errors: [`Supabase no responde: ${message}`] };
  } finally {
    clearTimeout(timeout);
  }
}
