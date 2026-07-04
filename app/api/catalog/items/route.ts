import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

const itemSchema = z.object({
  item_type: z.enum(["digital_product", "saas_offer", "service_template", "business_kit", "bundle", "lead_magnet", "subscription_plan"]),
  title: z.string().trim().min(3).max(180),
  short_description: z.string().trim().max(500).optional(),
  description: z.string().trim().max(10000).optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).default("EUR"),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(100).optional(),
  delivery_type: z.enum(["download", "service", "external", "access"]),
  external_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
  featured: z.coerce.boolean().default(false),
  commercial_use: z.coerce.boolean().default(false),
  affiliate_disclosure: z.coerce.boolean().default(false),
});

function isAdmin(req: NextRequest) {
  return req.cookies.get("affilix_admin")?.value === "true";
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.redirect(new URL("/login?redirect=/dashboard/catalog", req.url), 303);
  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());
  const parsed = itemSchema.safeParse({
    ...raw,
    featured: form.get("featured") === "on",
    commercial_use: form.get("commercial_use") === "on",
    affiliate_disclosure: form.get("affiliate_disclosure") === "on",
    price: form.get("price") || undefined,
    image_url: form.get("image_url") || "",
    external_url: form.get("external_url") || "",
  });
  if (!parsed.success) return NextResponse.redirect(new URL("/dashboard/catalog?error=invalid", req.url), 303);

  const data = parsed.data;
  if (data.delivery_type === "external" && !data.external_url) {
    return NextResponse.redirect(new URL("/dashboard/catalog?error=external-url", req.url), 303);
  }

  try {
    await getAdminDb().insert("catalog_items", {
      ...data,
      slug: slugify(`${data.title}-${Date.now().toString(36)}`),
      short_description: data.short_description || null,
      description: data.description || null,
      price: data.price ?? null,
      image_url: data.image_url || null,
      external_url: data.external_url || null,
      category: data.category || null,
    });
    return NextResponse.redirect(new URL("/dashboard/catalog?status=created", req.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/dashboard/catalog?error=database", req.url), 303);
  }
}

