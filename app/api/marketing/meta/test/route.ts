import { NextRequest, NextResponse } from "next/server";
import { getMetaConfig } from "@/lib/marketing/meta-ads";
import { decryptSecret } from "@/lib/security";
import { fetchWithTimeout } from "@/lib/utils";

const META_GRAPH_VERSION = "v24.0";

function normalizeAdAccount(id: string) {
  return id.startsWith("act_") ? id : `act_${id}`;
}

async function graphGet(path: string, token: string, fields: string) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}${path}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", token);
  const res = await fetchWithTimeout(url.toString(), {}, 12000);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) throw new Error(body?.error?.message || `Meta API HTTP ${res.status}`);
  return body;
}

function redirect(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: NextRequest) {
  const config = await getMetaConfig(null);
  if (!config) return redirect(req, "/dashboard/marketing/meta-ads?meta_test=error&message=Conecta%20Meta%20Ads%20primero");

  const token = decryptSecret(config.access_token || "");
  if (!token) return redirect(req, "/dashboard/marketing/meta-ads?meta_test=error&message=Falta%20Meta%20access%20token");
  if (!config.ad_account_id) return redirect(req, "/dashboard/marketing/meta-ads?meta_test=error&message=Falta%20Ad%20Account%20ID");
  if (!config.page_id) return redirect(req, "/dashboard/marketing/meta-ads?meta_test=error&message=Falta%20Page%20ID");

  try {
    await graphGet("/me", token, "id,name");
    await graphGet(`/${normalizeAdAccount(config.ad_account_id)}`, token, "id,name,account_status,currency");
    await graphGet(`/${config.page_id}`, token, "id,name");
    if (config.pixel_id) await graphGet(`/${config.pixel_id}`, token, "id,name");
    return redirect(req, "/dashboard/marketing/meta-ads?meta_test=ok");
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "No se pudo verificar Meta Ads");
    return redirect(req, `/dashboard/marketing/meta-ads?meta_test=error&message=${message}`);
  }
}
