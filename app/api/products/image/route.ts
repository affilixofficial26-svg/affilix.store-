import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase";
import { requiredEnv } from "@/lib/utils";

const imageSchema = z.object({
  product_id: z.string().uuid(),
  image_url: z.string().trim().url().optional(),
  redirect_to: z.string().trim().optional(),
});

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxImageBytes = 5 * 1024 * 1024;

function redirectToProduct(req: NextRequest, productId: string, state: "ok" | "error", message?: string) {
  const url = new URL(`/dashboard/products/${productId}`, req.url);
  url.searchParams.set("image", state);
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url, 303);
}

function redirectAfterImage(req: NextRequest, productId: string, redirectTo: string | undefined, state: "ok" | "error", message?: string) {
  if (redirectTo?.startsWith("/")) {
    const url = new URL(redirectTo, req.url);
    url.searchParams.set("images", state);
    if (state === "ok") url.searchParams.set("processed", "1");
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url, 303);
  }
  return redirectToProduct(req, productId, state, message);
}

async function ensurePublicBucket(supabaseUrl: string, serviceKey: string) {
  const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "product-images",
      name: "product-images",
      public: true,
      file_size_limit: maxImageBytes,
      allowed_mime_types: Array.from(allowedImageTypes),
    }),
    cache: "no-store",
  });
  if (res.ok || res.status === 409 || res.status === 400) return;
  throw new Error(await res.text());
}

async function uploadProductImage(productId: string, file: File) {
  if (!allowedImageTypes.has(file.type)) throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
  if (file.size <= 0 || file.size > maxImageBytes) throw new Error("La imagen debe pesar menos de 5 MB.");

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  await ensurePublicBucket(supabaseUrl, serviceKey);

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const objectPath = `${productId}/${Date.now()}.${extension}`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  });
  if (!uploadRes.ok) throw new Error(await uploadRes.text());
  return `${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const formData = contentType.includes("application/json") ? null : await req.formData();
  const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries(formData!.entries());
  const parsed = imageSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.image_url && !formData?.get("image_file"))) {
    if (!contentType.includes("application/json")) {
      const productId = String(body.product_id || "");
      return productId
        ? redirectAfterImage(req, productId, String(body.redirect_to || ""), "error", "URL o archivo de imagen invalido")
        : NextResponse.redirect(new URL("/dashboard/products?images=error&message=Imagen%20invalida", req.url), 303);
    }
    return NextResponse.json({ error: "URL o archivo de imagen invalido" }, { status: 400 });
  }

  let imageUrl = parsed.data.image_url || "";
  const file = formData?.get("image_file");
  try {
    if (file instanceof File && file.size > 0) {
      imageUrl = await uploadProductImage(parsed.data.product_id, file);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen";
    if (!contentType.includes("application/json")) return redirectAfterImage(req, parsed.data.product_id, parsed.data.redirect_to, "error", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const rows = await getAdminDb().update("affiliate_products", { id: parsed.data.product_id }, {
    image_url: imageUrl,
    images: [imageUrl],
    image_source: "supplier",
    is_active: true,
    updated_at: new Date().toISOString(),
  });

  if (!contentType.includes("application/json")) {
    return redirectAfterImage(req, parsed.data.product_id, parsed.data.redirect_to, "ok");
  }
  return NextResponse.json({ ok: true, product: rows[0] || null });
}
