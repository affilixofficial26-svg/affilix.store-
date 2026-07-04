import { NextRequest, NextResponse } from "next/server";
import { affiliateCookieName } from "@/lib/affiliate-auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/affiliate/login", req.url), 303);
  res.cookies.delete(affiliateCookieName);
  return res;
}
