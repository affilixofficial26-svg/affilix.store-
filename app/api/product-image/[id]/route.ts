import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char] || char));
}

function splitTitle(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 24 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === 2) break;
  }
  if (current && lines.length < 3) lines.push(current);
  return lines.slice(0, 3);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: AffiliateProduct | undefined;
  try {
    product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${id}`, limit: "1" }))[0];
  } catch {
    product = undefined;
  }

  const title = product?.ai_title || product?.title || "Producto AFFILIX";
  const category = product?.category || product?.platform || "Producto recomendado";
  const textLines = splitTitle(title)
    .map((line, index) => `<text x="80" y="${430 + index * 58}" fill="#f2f2fb" font-size="44" font-weight="800">${escapeXml(line)}</text>`)
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070711"/>
      <stop offset="0.55" stop-color="#111122"/>
      <stop offset="1" stop-color="#24170a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe59a"/>
      <stop offset="0.45" stop-color="#f5a623"/>
      <stop offset="1" stop-color="#9a6415"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <circle cx="970" cy="190" r="250" fill="#f5a623" opacity="0.09"/>
  <circle cx="220" cy="760" r="260" fill="#4f7cf5" opacity="0.08"/>
  <rect x="58" y="58" width="1084" height="784" rx="44" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.12)"/>
  <g filter="url(#shadow)">
    <path d="M112 240 188 86h64l-83 154h-57Z" fill="url(#gold)"/>
    <path d="M215 240 260 150h52l-45 90h-52Z" fill="url(#gold)"/>
    <path d="M240 186 270 128h104l32 58H240Z" fill="#d5d5d8"/>
    <path d="M338 84 458 240h-70L306 122 338 84Z" fill="#a8a8ad"/>
  </g>
  <text x="80" y="335" fill="#f5a623" font-family="Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="5">${escapeXml(String(category).toUpperCase())}</text>
  <g font-family="Arial, sans-serif">${textLines}</g>
  <text x="80" y="690" fill="#a7a7c6" font-family="Arial, sans-serif" font-size="26">Imagen automatica generada por AFFILIX para ficha de producto</text>
  <rect x="80" y="735" width="260" height="56" rx="16" fill="url(#gold)"/>
  <text x="112" y="771" fill="#070711" font-family="Arial, sans-serif" font-size="22" font-weight="900">VER PRODUCTO</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
