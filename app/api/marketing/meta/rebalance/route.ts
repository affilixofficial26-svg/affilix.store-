import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rebalanceBudgets } from "@/lib/marketing/meta-ads";

const schema = z.object({ totalBudget: z.coerce.number().min(1).max(100000), userId: z.string().uuid().nullable().optional() });

export async function POST(req: NextRequest) {
  const isJson = req.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    if (!isJson) return NextResponse.redirect(new URL("/dashboard/marketing/meta-ads?rebalance=error", req.url), 303);
    return NextResponse.json({ error: "Presupuesto invalido" }, { status: 400 });
  }
  const result = await rebalanceBudgets(parsed.data.userId || null, parsed.data.totalBudget);
  if (isJson) return NextResponse.json({ result });
  return NextResponse.redirect(new URL("/dashboard/marketing/meta-ads?rebalance=ok", req.url), 303);
}
