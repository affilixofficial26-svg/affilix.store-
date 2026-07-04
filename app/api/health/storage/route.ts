import { NextResponse } from "next/server";
import { requiredEnv } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function checkBucket(name: string) {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/storage/v1/bucket/${name}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return { name, ok: response.ok, status: response.status };
}

export async function GET() {
  try {
    const buckets = await Promise.all([
      checkBucket(process.env.SUPABASE_STORAGE_BUCKET_DIGITAL_ASSETS || "digital-products"),
      checkBucket(process.env.SUPABASE_STORAGE_BUCKET_MEDIA || "media-generated"),
      checkBucket(process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || "catalog-media"),
    ]);
    const ok = buckets.every((bucket) => bucket.ok);
    return NextResponse.json({ ok, buckets }, { status: ok ? 200 : 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage no disponible.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
