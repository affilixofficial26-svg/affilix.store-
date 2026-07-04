import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const message = String(data.message || "").trim();
  const text = message
    ? `AFFILIX recibio tu orden: ${message}. Abre el panel Agente IA y pulsa Enviar al agente para ejecutarla con acciones reales.`
    : "Escribe una orden para el agente desde el panel Agente IA.";
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
