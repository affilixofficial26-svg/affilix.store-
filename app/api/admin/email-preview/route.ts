import { NextRequest, NextResponse } from "next/server";
import { sendSystemEmail } from "@/lib/system-email";

function isAdmin(req: NextRequest) {
  return req.cookies.get("affilix_admin")?.value === "true";
}

function emailShell(title: string, body: string) {
  return `
  <div style="margin:0;background:#f3f6fb;padding:24px;font-family:Arial,sans-serif;color:#101828">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden">
      <div style="background:#06172f;color:white;padding:22px 26px">
        <div style="font-size:22px;font-weight:800">affilix.store</div>
        <div style="font-size:13px;color:#b9d8f5;margin-top:4px">${title}</div>
      </div>
      <div style="padding:26px">${body}</div>
      <div style="padding:18px 26px;background:#f8fafc;color:#667085;font-size:12px;line-height:1.6">
        Este es un correo de ejemplo generado desde el panel AFFILIX para revisar formato de notificaciones.
      </div>
    </div>
  </div>`;
}

const previews = [
  {
    subject: "AFFILIX Factura de ejemplo #AFX-2026-0001",
    category: "invoice",
    text: [
      "Factura de ejemplo AFFILIX",
      "Factura: AFX-2026-0001",
      "Cliente: Cliente Demo",
      "Producto: Freidora de aire digital 6L",
      "Venta bruta: 89.99 USD",
      "Comision AFFILIX estimada: 4.05 USD",
      "Estado: pendiente de confirmacion del proveedor",
    ].join("\n"),
    html: emailShell(
      "Factura de ejemplo",
      `
      <h1 style="margin:0 0 12px;font-size:26px">Factura #AFX-2026-0001</h1>
      <p style="margin:0 0 18px;color:#475467">Ejemplo de factura/notificacion de venta registrada.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:10px;border-bottom:1px solid #eaecf0">Producto</td><td style="padding:10px;border-bottom:1px solid #eaecf0;text-align:right;font-weight:700">Freidora de aire digital 6L</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eaecf0">Venta bruta</td><td style="padding:10px;border-bottom:1px solid #eaecf0;text-align:right">89.99 USD</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eaecf0">Comision estimada</td><td style="padding:10px;border-bottom:1px solid #eaecf0;text-align:right">4.05 USD</td></tr>
        <tr><td style="padding:10px">Estado</td><td style="padding:10px;text-align:right;color:#b54708;font-weight:700">Pendiente</td></tr>
      </table>
    `,
    ),
  },
  {
    subject: "AFFILIX Informe diario de ejemplo",
    category: "report",
    text: [
      "Informe diario de ejemplo",
      "Productos activos: 128",
      "Clicks registrados: 342",
      "Productos en oferta: 18",
      "Campanas Meta activas: 4",
      "Accion recomendada: promocionar productos con mayor CTR.",
    ].join("\n"),
    html: emailShell(
      "Informe diario de ejemplo",
      `
      <h1 style="margin:0 0 16px;font-size:26px">Resumen diario</h1>
      <div style="display:grid;gap:12px">
        <div style="padding:14px;border:1px solid #eaecf0;border-radius:12px"><strong>128</strong><br><span style="color:#667085">Productos activos</span></div>
        <div style="padding:14px;border:1px solid #eaecf0;border-radius:12px"><strong>342</strong><br><span style="color:#667085">Clicks registrados</span></div>
        <div style="padding:14px;border:1px solid #eaecf0;border-radius:12px"><strong>18</strong><br><span style="color:#667085">Productos en oferta</span></div>
        <div style="padding:14px;border:1px solid #eaecf0;border-radius:12px"><strong>4</strong><br><span style="color:#667085">Campanas Meta activas</span></div>
      </div>
    `,
    ),
  },
  {
    subject: "AFFILIX Venta/comision registrada de ejemplo",
    category: "sale",
    text: [
      "Nueva venta/comision registrada.",
      "Producto: Camara inteligente para mascotas",
      "Orden/factura: ORD-DEMO-3029",
      "Cliente: Cliente Demo",
      "Venta bruta: 49.99 USD",
      "Comision AFFILIX: 2.00 USD",
      "Estado: pending",
    ].join("\n"),
    html: emailShell(
      "Venta/comision de ejemplo",
      `
      <h1 style="margin:0 0 12px;font-size:26px">Venta registrada</h1>
      <p style="margin:0 0 18px;color:#475467">Ejemplo de aviso cuando entra una comision o venta.</p>
      <div style="border:1px solid #eaecf0;border-radius:14px;padding:16px">
        <p><strong>Producto:</strong> Camara inteligente para mascotas</p>
        <p><strong>Orden:</strong> ORD-DEMO-3029</p>
        <p><strong>Venta bruta:</strong> 49.99 USD</p>
        <p><strong>Comision AFFILIX:</strong> 2.00 USD</p>
        <p><strong>Estado:</strong> pending</p>
      </div>
    `,
    ),
  },
  {
    subject: "AFFILIX Alerta operativa de ejemplo",
    category: "alert",
    text: [
      "Alerta operativa de ejemplo",
      "Tipo: Revision requerida",
      "Detalle: Un proveedor necesita reconexion de credenciales.",
      "Prioridad: media",
    ].join("\n"),
    html: emailShell(
      "Alerta operativa de ejemplo",
      `
      <h1 style="margin:0 0 12px;font-size:26px">Revision requerida</h1>
      <p style="margin:0;color:#475467">Un proveedor necesita reconexion de credenciales. Este ejemplo muestra como llegara una alerta operativa.</p>
      <div style="margin-top:18px;padding:14px;border-radius:12px;background:#fff7ed;color:#9a3412;font-weight:700">Prioridad media</div>
    `,
    ),
  },
];

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const results = [];
  for (const preview of previews) {
    const result = await sendSystemEmail({
      subject: preview.subject,
      text: preview.text,
      html: preview.html,
      category: preview.category,
      metadata: { preview: true },
    });
    results.push({ subject: preview.subject, category: preview.category, ...result });
  }

  return NextResponse.json({ ok: results.every((item) => item.ok || item.queued), results });
}
