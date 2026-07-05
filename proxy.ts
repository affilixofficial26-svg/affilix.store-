import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { applySecurityHeaders, getRequestIp, isAllowedOrigin, looksLikeBot, rateLimit } from "@/lib/proxy-security";

const STORE_HOSTS = new Set(["store.affilix.es", "www.store.affilix.es", "affilix.store", "www.affilix.store"]);
const STORE_PUBLIC_ROUTES = [
  "/productos-digitales",
  "/servicios-ia",
  "/kits-negocio",
  "/herramientas-ia",
  "/comparador",
  "/afiliados",
  "/recursos",
  "/checkout",
  "/download",
  "/p",
  "/s",
  "/kit",
  "/tools",
  "/compare",
  "/legal",
  "/soporte",
  "/contacto",
];

const ADMIN_API_PREFIXES = [
  "/api/admin/",
  "/api/accounts/",
  "/api/ai/",
  "/api/catalog/",
  "/api/dashboard/",
  "/api/live-tests/",
  "/api/marketing/",
  "/api/muapi/",
  "/api/products/",
  "/api/settings/",
];

function isStoreHost(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].toLowerCase();
  return STORE_HOSTS.has(host);
}

function handleStoreHost(req: NextRequest) {
  if (!isStoreHost(req)) return null;
  const { pathname } = req.nextUrl;
  const isPublicAsset = /\.[a-z0-9]+$/i.test(pathname);
  if (
    pathname.startsWith("/_next/") ||
    isPublicAsset ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/affiliate") ||
    pathname.startsWith("/a/") ||
    pathname.startsWith("/go/") ||
    pathname.startsWith("/ofertas")
  ) return null;

  const url = req.nextUrl.clone();
  if (pathname === "/") return null;
  if (STORE_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;
  if (pathname === "/productos") {
    url.pathname = "/productos-digitales";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/productos/")) {
    url.pathname = pathname.replace(/^\/productos/, "/p");
    return NextResponse.redirect(url);
  }
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export function proxy(req: NextRequest) {
  if (req.method === "OPTIONS") return applySecurityHeaders(new NextResponse(null, { status: 204 }), req);

  const storeResponse = handleStoreHost(req);
  if (storeResponse) return applySecurityHeaders(storeResponse, req);

  if (req.nextUrl.pathname.startsWith("/api/")) {
    const isWebhook = req.nextUrl.pathname.startsWith("/api/webhooks/");
    if (isWebhook) return applySecurityHeaders(NextResponse.next(), req);
    if (!isAllowedOrigin(req)) return applySecurityHeaders(NextResponse.json({ error: "Origen no permitido" }, { status: 403 }), req);
    if (looksLikeBot(req)) return applySecurityHeaders(NextResponse.json({ error: "Solicitud bloqueada" }, { status: 403 }), req);
    const limited = rateLimit(`${getRequestIp(req)}:${req.nextUrl.pathname}`, 60, 60_000);
    if (!limited.allowed) return applySecurityHeaders(NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 }), req);

    if (ADMIN_API_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      const adminSession = verifyAdminSession(req.cookies.get("affilix_admin")?.value);
      if (!adminSession) {
        return applySecurityHeaders(NextResponse.json({ error: "No autorizado." }, { status: 401 }), req);
      }
    }
  }

  if (req.nextUrl.pathname.startsWith("/affiliate/panel") || req.nextUrl.pathname.startsWith("/affiliate/dashboard")) {
    const hasAffiliateSession = Boolean(req.cookies.get("affilix_affiliate")?.value);
    if (!hasAffiliateSession) return applySecurityHeaders(NextResponse.redirect(new URL("/affiliate/login", req.url)), req);
    return applySecurityHeaders(NextResponse.next(), req);
  }

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const isAdmin = Boolean(verifyAdminSession(req.cookies.get("affilix_admin")?.value));

    if (!isAdmin) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), req);
    }
  }

  return applySecurityHeaders(NextResponse.next(), req);
}

export const config = {
  matcher: ["/:path*"],
};
