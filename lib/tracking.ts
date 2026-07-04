import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { detectDevice, getClientIp } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";

export async function trackClick(req: NextRequest, product: AffiliateProduct) {
  const db = getAdminDb();
  const userAgent = req.headers.get("user-agent") || "";
  const referrer = req.headers.get("referer") || "";
  await db.insert("click_events", {
    user_id: product.user_id,
    product_id: product.id,
    session_id: req.cookies.get("affilix_session")?.value || crypto.randomUUID(),
    ip_address: getClientIp(req),
    user_agent: userAgent,
    referrer,
    device_type: detectDevice(userAgent),
  });
}
