import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/supabase-health";
import { getBalance } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

async function checkStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ready: false, errors: ["Faltan variables Supabase de storage."] };

  const buckets = await Promise.all(
    ["digital-products", "media-generated", "catalog-media"].map(async (name) => {
      const response = await fetch(`${url}/storage/v1/bucket/${name}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      return { name, ready: response.ok, status: response.status };
    }),
  );
  return { ready: buckets.every((bucket) => bucket.ready), buckets };
}

async function checkMuapi() {
  if (!process.env.MUAPI_API_KEY) return { ready: false, errors: ["Falta MUAPI_API_KEY."] };
  try {
    const balance = await getBalance();
    return { ready: true, balance_usd: balance.balance_usd };
  } catch (error) {
    const message = error instanceof Error ? error.message : "MuAPI no responde.";
    return { ready: false, errors: [message] };
  }
}

export async function GET() {
  const [database, storage, muapi] = await Promise.all([
    checkSupabaseHealth(),
    checkStorage(),
    checkMuapi(),
  ]);
  const ready = database.ready && storage.ready && muapi.ready;
  return NextResponse.json(
    {
      ready,
      service: "AFFILIX",
      timestamp: new Date().toISOString(),
      checks: { database, storage, muapi },
      errors: [database, storage, muapi].flatMap((check) => check.errors || []),
    },
    { status: ready ? 200 : 503 },
  );
}
