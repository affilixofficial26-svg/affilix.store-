import { NextRequest, NextResponse } from "next/server";
import { getPayPalEnvironment, isPayPalConfigured, paypalRequest } from "@/lib/paypal";
import { requireAdmin } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const configured = isPayPalConfigured();
  if (!configured) {
    return NextResponse.json({ configured: false, environment: getPayPalEnvironment(), ready: false });
  }
  try {
    await paypalRequest("/v1/identity/oauth2/userinfo?schema=paypalv1.1");
    return NextResponse.json({
      configured: true,
      environment: getPayPalEnvironment(),
      ready: true,
      webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      environment: getPayPalEnvironment(),
      ready: false,
      error: error instanceof Error ? error.message : "No se pudo validar PayPal.",
    }, { status: 502 });
  }
}

