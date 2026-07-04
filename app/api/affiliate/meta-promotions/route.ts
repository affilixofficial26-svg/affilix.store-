import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { createProductCampaign, getMetaConfig } from "@/lib/marketing/meta-ads";
import type { MetaConfig } from "@/lib/marketing/types";
import { notifyAdminAndAffiliate } from "@/lib/notifications";
import { encryptSecret } from "@/lib/security";
import { getStoreBaseUrl } from "@/lib/store-links";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct, PlatformAccount } from "@/types";

type AffiliateMetaAccount = {
  id: string;
  access_token: string | null;
  ad_account_id: string | null;
  page_id: string | null;
  pixel_id: string | null;
};

const schema = z.object({
  source_product_id: z.string().uuid(),
  meta_account_mode: z.enum(["affilix_main", "affiliate_own"]),
  budget_preset: z.coerce.number().min(1).max(100000).default(20),
  budget_custom: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().min(1).max(100000).optional()),
  own_access_token: z.string().trim().optional(),
  own_ad_account_id: z.string().trim().optional(),
  own_page_id: z.string().trim().optional(),
  own_pixel_id: z.string().trim().optional(),
});

function affiliateMainUrl(storeSlug: string, productSlug: string) {
  return `${getStoreBaseUrl()}/a/go/${storeSlug}/main/${productSlug}`;
}

async function ensureProduct(productId: string) {
  const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", {
    select: "*",
    id: `eq.${productId}`,
    is_active: "eq.true",
    image_url: "not.is.null",
    limit: "1",
  }))[0];
  if (!product) throw new Error("Producto no disponible para promocion");

  const connectedProvider = (await getAdminDb().select<PlatformAccount>("platform_accounts", {
    select: "id",
    user_id: "is.null",
    platform: `eq.${product.platform}`,
    connected: "eq.true",
    last_test_status: "eq.success",
    limit: "1",
  }))[0];
  if (!connectedProvider) throw new Error("El proveedor de este producto no esta conectado en el panel principal");

  return product;
}

async function getOwnMetaConfig(partnerId: string, input: z.infer<typeof schema>): Promise<MetaConfig> {
  const existing = (await getAdminDb().select<AffiliateMetaAccount>("affiliate_meta_accounts", {
    select: "*",
    partner_id: `eq.${partnerId}`,
    limit: "1",
  }).catch(() => []))[0];

  const accessToken = input.own_access_token ? encryptSecret(input.own_access_token) : existing?.access_token || null;
  const adAccountId = input.own_ad_account_id || existing?.ad_account_id || null;
  const pageId = input.own_page_id || existing?.page_id || null;
  const pixelId = input.own_pixel_id || existing?.pixel_id || null;

  if (!accessToken || !adAccountId || !pageId) {
    throw new Error("Para usar tu Meta propia debes guardar access token, ad account ID y page ID");
  }

  const payload = {
    partner_id: partnerId,
    access_token: accessToken,
    ad_account_id: adAccountId,
    page_id: pageId,
    pixel_id: pixelId,
    connected: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await getAdminDb().update("affiliate_meta_accounts", { id: existing.id }, payload).catch(() => null);
  } else {
    await getAdminDb().insert("affiliate_meta_accounts", payload).catch(() => null);
  }

  return {
    user_id: null,
    access_token: accessToken,
    ad_account_id: adAccountId,
    page_id: pageId,
    pixel_id: pixelId,
    monthly_budget: input.budget_custom || input.budget_preset,
    auto_distribute: false,
    min_priority_score: 1,
  };
}

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login", req.url), 303);

  const form = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.redirect(new URL("/affiliate/panel?meta=invalid#promociones-meta", req.url), 303);

  const input = parsed.data;
  const budgetAmount = input.budget_custom || input.budget_preset;
  const destinationUrl = affiliateMainUrl(partner.store_slug, "");

  try {
    const product = await ensureProduct(input.source_product_id);
    const targetUrl = affiliateMainUrl(partner.store_slug, product.slug);
    const config = input.meta_account_mode === "affilix_main"
      ? await getMetaConfig(null)
      : await getOwnMetaConfig(partner.id, input);

    if (!config) throw new Error("La cuenta Meta principal AFFILIX no esta conectada");

    const campaign = await createProductCampaign(product, budgetAmount, config, {
      destinationUrl: targetUrl,
      campaignNamePrefix: input.meta_account_mode === "affilix_main" ? `AFFILIX Partner ${partner.store_slug}` : `${partner.brand_name} Meta`,
    });

    await getAdminDb().insert("affiliate_meta_promotions", {
      partner_id: partner.id,
      source_product_id: product.id,
      meta_account_mode: input.meta_account_mode,
      budget_amount: budgetAmount,
      currency: "EUR",
      destination_url: targetUrl || destinationUrl,
      campaign_id: campaign.campaign_id,
      adset_id: campaign.adset_id,
      ad_id: campaign.ad_id,
      status: "paused",
    }).catch(() => null);

    await notifyAdminAndAffiliate(
      {
        type: "affiliate_meta_promotion",
        title: "Promocion Meta creada",
        message: `${partner.full_name} creo una promocion Meta de ${budgetAmount} EUR para ${product.title}.`,
        actorType: "affiliate",
        actorId: partner.id,
        actorName: partner.full_name,
        data: { productId: product.id, productTitle: product.title, budgetAmount, mode: input.meta_account_mode, campaignId: campaign.campaign_id },
      },
      {
        partnerId: partner.id,
        type: "meta_promotion",
        title: "Promocion Meta creada",
        message: `Tu promocion de ${product.title} fue creada en estado pausado.`,
        data: { productId: product.id, productTitle: product.title, budgetAmount, mode: input.meta_account_mode, campaignId: campaign.campaign_id },
      },
    );

    return NextResponse.redirect(new URL("/affiliate/panel?meta=ready#promociones-meta", req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la promocion Meta";
    await getAdminDb().insert("affiliate_meta_promotions", {
      partner_id: partner.id,
      source_product_id: input.source_product_id,
      meta_account_mode: input.meta_account_mode,
      budget_amount: budgetAmount,
      currency: "EUR",
      destination_url: "",
      status: "error",
      error_message: message,
    }).catch(() => null);
    await notifyAdminAndAffiliate(
      {
        type: "affiliate_meta_error",
        title: "Error en promocion Meta",
        message: `${partner.full_name} intento crear una promocion Meta y fallo: ${message}`,
        actorType: "affiliate",
        actorId: partner.id,
        actorName: partner.full_name,
        data: { productId: input.source_product_id, budgetAmount, mode: input.meta_account_mode, error: message },
      },
      {
        partnerId: partner.id,
        type: "meta_error",
        title: "No se pudo crear la promocion Meta",
        message,
        data: { productId: input.source_product_id, budgetAmount, mode: input.meta_account_mode },
      },
    );
    const url = new URL("/affiliate/panel", req.url);
    url.searchParams.set("meta", "error");
    url.searchParams.set("message", message);
    url.hash = "promociones-meta";
    return NextResponse.redirect(url, 303);
  }
}
