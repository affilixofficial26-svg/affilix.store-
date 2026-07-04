import { requiredEnv } from "@/lib/utils";

type QueryValue = string | number | boolean | null | undefined;

export class SupabaseRestClient {
  private readonly url: string;
  private readonly key: string;

  constructor(serviceRole = false) {
    this.url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
    this.key = serviceRole ? requiredEnv("SUPABASE_SERVICE_ROLE_KEY") : requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  private headers(extra?: HeadersInit) {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extra,
    };
  }

  private async request(url: string, init: RequestInit, context: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`${context}: HTTP ${response.status}${detail ? ` — ${detail}` : ""}`);
      }
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error(`[Supabase] ${context}`, { message });
      throw new Error(`${context}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async select<T>(table: string, query: Record<string, QueryValue> = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const res = await this.request(`${this.url}/rest/v1/${table}?${params.toString()}`, { headers: this.headers(), cache: "no-store" }, `SELECT ${table}`);
    return (await res.json()) as T[];
  }

  async insert<T>(table: string, body: unknown) {
    const res = await this.request(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    }, `INSERT ${table}`);
    return (await res.json()) as T[];
  }

  async upsert<T>(table: string, body: unknown, onConflict: string) {
    const params = new URLSearchParams({ on_conflict: onConflict });
    const res = await this.request(`${this.url}/rest/v1/${table}?${params.toString()}`, {
      method: "POST",
      headers: this.headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(body),
      cache: "no-store",
    }, `UPSERT ${table}`);
    return (await res.json()) as T[];
  }

  async update<T>(table: string, filters: Record<string, QueryValue>, body: unknown) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => params.set(key, `eq.${value}`));
    const res = await this.request(`${this.url}/rest/v1/${table}?${params.toString()}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    }, `UPDATE ${table}`);
    return (await res.json()) as T[];
  }

  async delete(table: string, filters: Record<string, QueryValue>) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => params.set(key, `eq.${value}`));
    await this.request(`${this.url}/rest/v1/${table}?${params.toString()}`, {
      method: "DELETE",
      headers: this.headers(),
      cache: "no-store",
    }, `DELETE ${table}`);
    return true;
  }
}

export function getAdminDb() {
  return new SupabaseRestClient(true);
}
