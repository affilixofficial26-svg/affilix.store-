import { NextRequest, NextResponse } from "next/server";
import { notifyAdmin } from "@/lib/notifications";
import { notifyNewUser } from "@/lib/system-email";

function getStringValue(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json().catch(() => ({})) : Object.fromEntries((await req.formData()).entries());
  const email = getStringValue(data, ["email", "user_email", "correo"]);
  const name = getStringValue(data, ["name", "full_name", "nombre"]);

  if (email) {
    await notifyNewUser({ email, name, source: "auth_register" });
    await notifyAdmin({
      type: "user_registered",
      title: "Nuevo usuario registrado",
      message: `${name || email} se registro en AFFILIX.`,
      actorType: "user",
      actorName: name || email,
      data: { email, name },
    });
  }

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), 303);
}
