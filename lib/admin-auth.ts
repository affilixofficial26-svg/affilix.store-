import { NextResponse } from "next/server";

export function getAdminCredentials() {
  const credentials = new Map<string, string>();
  const rawJson = process.env.ADMIN_USERS_JSON;

  if (rawJson) {
    const candidates = [
      rawJson,
      rawJson.replace(/\\"/g, '"'),
      rawJson.replace(/^"|"$/g, "").replace(/\\"/g, '"'),
    ];
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        Object.entries(parsed).forEach(([email, password]) => {
          if (typeof password === "string" && password) credentials.set(email.trim().toLowerCase(), password);
        });
        break;
      } catch {
        // Compatible con variables pegadas con escape distinto en Vercel.
      }
    }
  }

  const inlineUsers = (process.env.ADMIN_USERS || "").split("|").map((item) => item.trim()).filter(Boolean);
  inlineUsers.forEach((item) => {
    const [email, ...passwordParts] = item.split(":");
    const password = passwordParts.join(":");
    if (email && password) credentials.set(email.trim().toLowerCase(), password);
  });

  const fallbackPassword = String(process.env.ADMIN_PASSWORD || "");
  if (fallbackPassword) {
    [
      process.env.ADMIN_EMAIL,
      ...(process.env.GOOGLE_ALLOWED_EMAILS || "").split(","),
    ]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
      .forEach((adminEmail) => credentials.set(adminEmail, fallbackPassword));
  }

  return credentials;
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminCredentials = getAdminCredentials();
  return {
    configured: adminCredentials.size > 0,
    valid: adminCredentials.get(email.trim().toLowerCase()) === password,
  };
}

export function setAdminSessionCookie(res: NextResponse) {
  res.cookies.set("affilix_admin", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
