import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete("affilix_admin");
  res.cookies.delete("affilix_affiliate");
  return res;
}
