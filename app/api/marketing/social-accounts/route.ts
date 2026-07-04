import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";

const schema = z.object({
  facebook_page_id: z.string().trim().max(200).optional(),
  facebook_page_token: z.string().trim().max(5000).optional(),
  instagram_business_id: z.string().trim().max(200).optional(),
  instagram_token: z.string().trim().max(5000).optional(),
  pinterest_token: z.string().trim().max(5000).optional(),
  pinterest_board_id: z.string().trim().max(200).optional(),
  twitter_bearer_token: z.string().trim().max(5000).optional(),
  twitter_api_key: z.string().trim().max(5000).optional(),
  twitter_api_secret: z.string().trim().max(5000).optional(),
  twitter_access_token: z.string().trim().max(5000).optional(),
  twitter_access_secret: z.string().trim().max(5000).optional(),
  facebook_enabled: z.coerce.boolean().optional(),
  instagram_enabled: z.coerce.boolean().optional(),
  pinterest_enabled: z.coerce.boolean().optional(),
  twitter_enabled: z.coerce.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const form = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse({
    ...form,
    facebook_enabled: form.facebook_enabled === "on",
    instagram_enabled: form.instagram_enabled === "on",
    pinterest_enabled: form.pinterest_enabled === "on",
    twitter_enabled: form.twitter_enabled === "on",
  });
  if (!parsed.success) return NextResponse.json({ error: "Configuracion social invalida" }, { status: 400 });
  await getAdminDb().upsert("social_accounts", {
    user_id: null,
    facebook_page_id: parsed.data.facebook_page_id || null,
    facebook_page_token: encryptSecret(parsed.data.facebook_page_token),
    instagram_business_id: parsed.data.instagram_business_id || null,
    instagram_token: encryptSecret(parsed.data.instagram_token),
    pinterest_token: encryptSecret(parsed.data.pinterest_token),
    pinterest_board_id: parsed.data.pinterest_board_id || null,
    twitter_bearer_token: encryptSecret(parsed.data.twitter_bearer_token),
    twitter_api_key: encryptSecret(parsed.data.twitter_api_key),
    twitter_api_secret: encryptSecret(parsed.data.twitter_api_secret),
    twitter_access_token: encryptSecret(parsed.data.twitter_access_token),
    twitter_access_secret: encryptSecret(parsed.data.twitter_access_secret),
    facebook_enabled: Boolean(parsed.data.facebook_enabled),
    instagram_enabled: Boolean(parsed.data.instagram_enabled),
    pinterest_enabled: Boolean(parsed.data.pinterest_enabled),
    twitter_enabled: Boolean(parsed.data.twitter_enabled),
    updated_at: new Date().toISOString(),
  }, "user_id");
  return NextResponse.redirect(new URL("/dashboard/marketing/social-accounts", req.url), 303);
}
