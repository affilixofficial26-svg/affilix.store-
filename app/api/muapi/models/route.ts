import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const query: Record<string, string> = {
    select: "*",
    active: "eq.true",
    order: "category.asc,display_name.asc",
  };
  if (category) query.category = `eq.${category}`;

  try {
    const models = await getAdminDb().select("muapi_models", query);
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer el catalogo MuAPI.";
    return NextResponse.json({ error: message, models: [] }, { status: 500 });
  }
}
