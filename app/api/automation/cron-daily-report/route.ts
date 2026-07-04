import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { sendDailyReport } from "@/lib/system-email";

export const dynamic = "force-dynamic";

type CommissionRow = {
  commission_amount?: number | string | null;
  sale_amount?: number | string | null;
  earned_at?: string | null;
};

type ProductRow = {
  created_at?: string | null;
};

type ClickRow = {
  clicked_at?: string | null;
};

type UserRow = {
  created_at?: string | null;
};

type EmailOutboxRow = {
  created_at?: string | null;
  category?: string | null;
};

function inRange(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date >= start && date < end;
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

async function safeSelect<T>(table: string, query: Record<string, string>) {
  try {
    return await getAdminDb().select<T>(table, query);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 1);
  const startIso = start.toISOString();
  const dateLabel = startIso.slice(0, 10);

  const [products, clicks, commissions, users, emailErrors] = await Promise.all([
    safeSelect<ProductRow>("affiliate_products", { select: "created_at", created_at: `gte.${startIso}` }),
    safeSelect<ClickRow>("click_events", { select: "clicked_at", clicked_at: `gte.${startIso}` }),
    safeSelect<CommissionRow>("commissions", { select: "commission_amount,sale_amount,earned_at", earned_at: `gte.${startIso}` }),
    safeSelect<UserRow>("user_profiles", { select: "created_at", created_at: `gte.${startIso}` }),
    safeSelect<EmailOutboxRow>("system_email_outbox", { select: "category,created_at", category: "eq.provider_error", created_at: `gte.${startIso}` }),
  ]);

  const dayProducts = products.filter((item) => inRange(item.created_at, start, end));
  const dayClicks = clicks.filter((item) => inRange(item.clicked_at, start, end));
  const dayCommissions = commissions.filter((item) => inRange(item.earned_at, start, end));
  const dayUsers = users.filter((item) => inRange(item.created_at, start, end));
  const dayProviderErrors = emailErrors.filter((item) => inRange(item.created_at, start, end));

  const grossSalesAmount = dayCommissions.reduce((sum, item) => sum + money(item.sale_amount), 0);
  const commissionAmount = dayCommissions.reduce((sum, item) => sum + money(item.commission_amount), 0);

  const report = {
    dateLabel,
    productsPublished: dayProducts.length,
    clicks: dayClicks.length,
    sales: dayCommissions.length,
    grossSalesAmount,
    commissionAmount,
    providerErrors: dayProviderErrors.length,
    newUsers: dayUsers.length,
  };

  const email = await sendDailyReport(report);
  await getAdminDb().insert("agent_logs", {
    user_id: null,
    action: "cron-daily-report",
    details: { report, email },
    status: email.ok || email.queued ? "success" : "error",
  }).catch(() => null);

  return NextResponse.json({ ok: email.ok || email.queued, report, email });
}
