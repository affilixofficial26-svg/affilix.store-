import { getAdminDb } from "@/lib/supabase";

type AdminNotificationInput = {
  type: string;
  title: string;
  message: string;
  actorType?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  data?: Record<string, unknown>;
};

type AffiliateNotificationInput = {
  partnerId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export async function notifyAdmin(input: AdminNotificationInput) {
  try {
    await getAdminDb().insert("admin_notifications", {
      type: input.type,
      title: input.title,
      message: input.message,
      actor_type: input.actorType || null,
      actor_id: input.actorId || null,
      actor_name: input.actorName || null,
      data: input.data || {},
    });
  } catch {
    // Las notificaciones no deben bloquear ventas, clicks ni logins.
  }
}

export async function notifyAffiliate(input: AffiliateNotificationInput) {
  try {
    await getAdminDb().insert("affiliate_notifications", {
      partner_id: input.partnerId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
    });
  } catch {
    // Las notificaciones no deben bloquear ventas, clicks ni logins.
  }
}

export async function notifyAdminAndAffiliate(admin: AdminNotificationInput, affiliate: AffiliateNotificationInput) {
  await Promise.all([notifyAdmin(admin), notifyAffiliate(affiliate)]);
}
