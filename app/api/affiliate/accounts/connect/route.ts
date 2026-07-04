import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { saveAffiliateProviderAccount } from "@/lib/affiliate-provider-accounts";

const affiliatePlatformSchema = z.object({
  platform: z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]),
  primary_key: z.string().max(4000).optional(),
  secondary_key: z.string().max(4000).optional(),
});

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login", req.url), 303);

  const data = Object.fromEntries((await req.formData()).entries());
  const parsed = affiliatePlatformSchema.safeParse(data);
  const referer = req.headers.get("referer") || "/affiliate/dashboard";

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=invalid`, req.url), 303);
  }

  await saveAffiliateProviderAccount({
    partner_id: partner.id,
    platform: parsed.data.platform,
    primary_key: parsed.data.primary_key || "",
    secondary_key: parsed.data.secondary_key || "",
    connected: false,
    last_test_status: null,
    last_test_message: "Credenciales guardadas. Pulsa Probar conexion para confirmar que el proveedor responde.",
  });

  return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=saved`, req.url), 303);
}
