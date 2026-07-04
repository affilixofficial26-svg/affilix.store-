import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveLocalAiConfig } from "@/lib/local-ai-config";
import { slugify } from "@/lib/utils";

const settingsSchema = z.object({
  store_name: z.string().trim().min(2).max(120),
  store_slug: z.string().trim().max(120).optional(),
  currency: z.enum(["EUR", "USD", "MXN"]),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = settingsSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dashboard/settings?settings=invalid", req.url), 303);
  }

  const storeSlug = parsed.data.store_slug?.trim()
    ? slugify(parsed.data.store_slug)
    : slugify(parsed.data.store_name);

  await saveLocalAiConfig({
    store_name: parsed.data.store_name,
    store_slug: storeSlug,
    currency: parsed.data.currency,
  });

  return NextResponse.redirect(new URL("/dashboard/settings?settings=ok", req.url), 303);
}
