import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyComplaint } from "@/lib/system-email";

const complaintSchema = z.object({
  subject: z.string().trim().max(160).optional(),
  customer_email: z.string().trim().email().optional(),
  customer_name: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5).max(5000),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json().catch(() => ({})) : Object.fromEntries((await req.formData()).entries());
  const parsed = complaintSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de reclamacion invalidos" }, { status: 400 });
  }

  const result = await notifyComplaint({
    subject: parsed.data.subject,
    customerEmail: parsed.data.customer_email,
    customerName: parsed.data.customer_name,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: result.ok || result.queued, email: result });
}
