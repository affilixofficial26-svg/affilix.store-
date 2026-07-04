import { fetchWithTimeout } from "@/lib/utils";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisUrl || !redisToken) return null;
  const res = await fetchWithTimeout(`${redisUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
  });
  if (!res.ok) return null;
  const payload = (await res.json()) as { result?: string | null };
  return payload.result ? (JSON.parse(payload.result) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 1800) {
  if (!redisUrl || !redisToken) return;
  await fetchWithTimeout(`${redisUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${ttlSeconds}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}` },
  });
}

export async function rateLimit(key: string, seconds: number) {
  const existing = await cacheGet<{ locked: boolean }>(`rate:${key}`);
  if (existing?.locked) throw new Error("Rate limit activo. Intenta de nuevo en unos segundos.");
  await cacheSet(`rate:${key}`, { locked: true }, seconds);
}
