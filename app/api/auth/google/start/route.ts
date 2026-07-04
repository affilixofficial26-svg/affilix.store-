import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, createGoogleState, getGoogleCookieOptions, googleRedirectCookie, googleStateCookie } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  const state = createGoogleState();
  const redirect = req.nextUrl.searchParams.get("redirect") || "/dashboard";
  const { url, redirectTo } = buildGoogleAuthUrl(req.nextUrl.origin, redirect, state);
  const res = NextResponse.redirect(url);
  res.cookies.set(googleStateCookie, state, getGoogleCookieOptions());
  res.cookies.set(googleRedirectCookie, redirectTo, getGoogleCookieOptions());
  return res;
}
