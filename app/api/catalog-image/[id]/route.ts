import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

type CatalogImageRow = {
  id: string;
  title: string | null;
  category: string | null;
  image_url: string | null;
};

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char] || char));
}

function fallbackImage(title = "AFFILIX", category = "Producto digital") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07111f"/>
      <stop offset="0.55" stop-color="#111827"/>
      <stop offset="1" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <rect x="72" y="72" width="1056" height="756" rx="42" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.16)"/>
  <text x="96" y="260" fill="#67e8f9" font-family="Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="5">${escapeXml(category.toUpperCase())}</text>
  <text x="96" y="420" fill="#ffffff" font-family="Arial, sans-serif" font-size="66" font-weight="900">${escapeXml(title.slice(0, 32))}</text>
  <text x="96" y="700" fill="#bae6fd" font-family="Arial, sans-serif" font-size="30">AFFILIX</text>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let item: CatalogImageRow | undefined;

  try {
    item = (await getAdminDb().select<CatalogImageRow>("catalog_items", { select: "id,title,category,image_url", id: `eq.${id}`, status: "eq.published", limit: "1" }))[0];
  } catch {
    item = undefined;
  }

  if (item?.image_url && /^https?:\/\//i.test(item.image_url)) {
    try {
      const upstream = await fetch(item.image_url, { cache: "force-cache", next: { revalidate: 86400 } });
      if (upstream.ok && upstream.body) {
        return new NextResponse(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") || "image/png",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    } catch {
      // Fall through to generated fallback.
    }
  }

  return new NextResponse(fallbackImage(item?.title || "AFFILIX", item?.category || "Producto digital"), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
