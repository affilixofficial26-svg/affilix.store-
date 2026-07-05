import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase";

const ticketSchema = z.object({
  name: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
  source: z.string().trim().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = ticketSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.redirect(new URL("/contacto?error=invalid", req.url), 303);

  await getAdminDb().insert("support_tickets", {
    name: parsed.data.name || null,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    category: parsed.data.source || "contacto",
    priority: "normal",
    status: "open",
  });

  return NextResponse.redirect(new URL("/soporte?ticket=created", req.url), 303);
}
