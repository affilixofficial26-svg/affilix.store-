import { getAdminDb } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/utils";

type SystemEmailInput = {
  to?: string[];
  subject: string;
  text: string;
  html?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
};

export function getSystemOwnerEmail() {
  return (process.env.OWNER_EMAIL || process.env.SYSTEM_OWNER_EMAIL || process.env.ADMIN_EMAIL || "affilixofficial26@gmail.com").trim().toLowerCase();
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "AFFILIX <notificaciones@affilix.es>";
}

function getResendApiKey() {
  return (process.env.RESEND_API_KEY || "").replace(/\uFEFF/g, "").trim();
}

async function saveOutbox(input: SystemEmailInput, status: "pending" | "sent" | "failed", provider?: string, providerMessageId?: string, errorMessage?: string) {
  try {
    await getAdminDb().insert("system_email_outbox", {
      recipient_email: (input.to && input.to.length ? input.to : [getSystemOwnerEmail()]).join(","),
      subject: input.subject,
      text_body: input.text,
      html_body: input.html || null,
      category: input.category || "system",
      provider: provider || null,
      provider_message_id: providerMessageId || null,
      status,
      error_message: errorMessage || null,
      metadata: input.metadata || {},
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch {
    // La notificacion por correo nunca debe impedir registrar una venta.
  }
}

export async function sendSystemEmail(input: SystemEmailInput) {
  const resendApiKey = getResendApiKey();
  if (!resendApiKey) {
    await saveOutbox(input, "pending");
    return { ok: false, queued: true, reason: "RESEND_API_KEY no configurada" };
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: getEmailFrom(),
          to: input.to && input.to.length ? input.to : [getSystemOwnerEmail()],
          subject: input.subject,
          text: input.text,
          html: input.html,
          attachments: input.attachments,
        }),
      },
      12000,
    );

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = typeof body?.message === "string" ? body.message : `Error HTTP ${response.status}`;
      await saveOutbox(input, "failed", "resend", undefined, error);
      return { ok: false, queued: false, reason: error };
    }

    await saveOutbox(input, "sent", "resend", typeof body?.id === "string" ? body.id : undefined);
    return { ok: true, queued: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido enviando email";
    await saveOutbox(input, "failed", "resend", undefined, message);
    return { ok: false, queued: false, reason: message };
  }
}

export async function notifyOwnerSale(input: {
  source: string;
  affiliateName?: string | null;
  affiliateEmail?: string | null;
  productTitle?: string | null;
  orderId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  grossSaleAmount?: number | string | null;
  totalCommissionAmount?: number | string | null;
  affiliateCommissionAmount?: number | string | null;
  ownerCommissionAmount?: number | string | null;
  status?: string | null;
}) {
  const subject = `AFFILIX venta registrada: ${input.productTitle || input.orderId || input.source}`;
  const lines = [
    "Nueva venta/comision registrada en AFFILIX.",
    "",
    `Origen: ${input.source}`,
    `Afiliado: ${input.affiliateName || "N/D"} (${input.affiliateEmail || "N/D"})`,
    `Producto: ${input.productTitle || "N/D"}`,
    `Orden/factura: ${input.orderId || "N/D"}`,
    `Cliente: ${input.customerName || "N/D"} (${input.customerEmail || "N/D"})`,
    `Venta bruta: ${input.grossSaleAmount ?? "N/D"}`,
    `Comision total: ${input.totalCommissionAmount ?? "N/D"}`,
    `Comision afiliado: ${input.affiliateCommissionAmount ?? "N/D"}`,
    `Comision AFFILIX: ${input.ownerCommissionAmount ?? "N/D"}`,
    `Estado: ${input.status || "pending"}`,
  ];

  return sendSystemEmail({
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "sale",
    metadata: input,
  });
}

export async function notifyNewUser(input: {
  email?: string | null;
  name?: string | null;
  source?: string | null;
}) {
  const subject = `AFFILIX nuevo usuario registrado: ${input.email || input.name || "sin email"}`;
  const lines = [
    "Nuevo usuario registrado en AFFILIX.",
    "",
    `Nombre: ${input.name || "N/D"}`,
    `Email: ${input.email || "N/D"}`,
    `Origen: ${input.source || "registro web"}`,
    `Fecha: ${new Date().toISOString()}`,
  ];

  return sendSystemEmail({
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "user",
    metadata: input,
  });
}

export async function notifyProviderError(input: {
  platform: string;
  message: string;
  severity?: "low" | "medium" | "high";
}) {
  const subject = `AFFILIX proveedor requiere revision: ${input.platform}`;
  const lines = [
    "Un proveedor fallo la prueba de conexion en AFFILIX.",
    "",
    `Proveedor: ${input.platform}`,
    `Prioridad: ${input.severity || "medium"}`,
    `Error: ${input.message}`,
    `Fecha: ${new Date().toISOString()}`,
  ];

  return sendSystemEmail({
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "provider_error",
    metadata: input,
  });
}

export async function notifyComplaint(input: {
  subject?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  message: string;
}) {
  const subject = `AFFILIX reclamacion recibida: ${input.subject || input.customerEmail || "sin asunto"}`;
  const lines = [
    "Nueva reclamacion o mensaje de soporte recibido.",
    "",
    `Cliente: ${input.customerName || "N/D"} (${input.customerEmail || "N/D"})`,
    `Asunto: ${input.subject || "N/D"}`,
    "",
    input.message,
  ];

  return sendSystemEmail({
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "complaint",
    metadata: input,
  });
}

export async function sendInvoiceEmail(input: {
  invoiceNumber: string;
  customerEmail?: string | null;
  customerName?: string | null;
  productTitle?: string | null;
  grossSaleAmount?: number | string | null;
  ownerCommissionAmount?: number | string | null;
  status?: string | null;
  pdfBase64?: string | null;
}) {
  const subject = `AFFILIX factura registrada: ${input.invoiceNumber}`;
  const lines = [
    "Factura registrada en AFFILIX.",
    "",
    `Factura: ${input.invoiceNumber}`,
    `Cliente: ${input.customerName || "N/D"} (${input.customerEmail || "N/D"})`,
    `Producto: ${input.productTitle || "N/D"}`,
    `Venta bruta: ${input.grossSaleAmount ?? "N/D"}`,
    `Comision AFFILIX: ${input.ownerCommissionAmount ?? "N/D"}`,
    `Estado: ${input.status || "pending"}`,
  ];

  return sendSystemEmail({
    to: Array.from(new Set([input.customerEmail, getSystemOwnerEmail()].filter((value): value is string => Boolean(value)))),
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "invoice",
    metadata: input,
    attachments: input.pdfBase64 ? [{ filename: `${input.invoiceNumber}.pdf`, content: input.pdfBase64 }] : undefined,
  });
}

export async function sendDailyReport(input: {
  dateLabel: string;
  productsPublished: number;
  clicks: number;
  sales: number;
  grossSalesAmount: number;
  commissionAmount: number;
  providerErrors: number;
  newUsers: number;
}) {
  const subject = `AFFILIX informe diario: ${input.dateLabel}`;
  const lines = [
    "Informe diario de AFFILIX.",
    "",
    `Fecha: ${input.dateLabel}`,
    `Productos publicados: ${input.productsPublished}`,
    `Clicks registrados: ${input.clicks}`,
    `Ventas/comisiones: ${input.sales}`,
    `Venta bruta: ${input.grossSalesAmount.toFixed(2)}`,
    `Comision registrada: ${input.commissionAmount.toFixed(2)}`,
    `Errores de proveedor: ${input.providerErrors}`,
    `Usuarios nuevos: ${input.newUsers}`,
  ];

  return sendSystemEmail({
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
    category: "daily_report",
    metadata: input,
  });
}
