import { decryptSecret, encryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import type { Platform } from "@/types";

export type AffiliateProviderAccount = {
  id?: string;
  partner_id: string;
  platform: Platform;
  credentials?: {
    primary_key?: string;
    secondary_key?: string;
  };
  connected: boolean;
  last_test_status: "success" | "error" | null;
  last_test_message: string | null;
  updated_at?: string;
};

type StoredAffiliateProviderAccount = AffiliateProviderAccount;

export function fromStoredAffiliateProviderAccount(account: StoredAffiliateProviderAccount): AffiliateProviderAccount {
  return {
    id: account.id,
    partner_id: account.partner_id,
    platform: account.platform,
    credentials: {
      primary_key: decryptSecret(account.credentials?.primary_key),
      secondary_key: decryptSecret(account.credentials?.secondary_key),
    },
    connected: Boolean(account.connected),
    last_test_status: account.last_test_status,
    last_test_message: account.last_test_message,
    updated_at: account.updated_at,
  };
}

export async function getAffiliateProviderAccounts(partnerId: string) {
  const rows = await getAdminDb().select<StoredAffiliateProviderAccount>("affiliate_partner_accounts", {
    select: "id,partner_id,platform,credentials,connected,last_test_status,last_test_message,updated_at",
    partner_id: `eq.${partnerId}`,
    order: "updated_at.desc",
    limit: "80",
  });
  const deduped = new Map<Platform, AffiliateProviderAccount>();
  rows.map(fromStoredAffiliateProviderAccount).forEach((account) => {
    if (!deduped.has(account.platform)) deduped.set(account.platform, account);
  });
  return Array.from(deduped.values());
}

export async function getAffiliateProviderAccountMap(partnerId: string) {
  const accounts = await getAffiliateProviderAccounts(partnerId);
  return new Map(accounts.map((account) => [account.platform, account]));
}

export async function saveAffiliateProviderAccount(input: {
  partner_id: string;
  platform: Platform;
  primary_key?: string;
  secondary_key?: string;
  connected?: boolean;
  last_test_status?: "success" | "error" | null;
  last_test_message?: string | null;
}) {
  const payload = {
    partner_id: input.partner_id,
    platform: input.platform,
    credentials: {
      primary_key: encryptSecret(input.primary_key || ""),
      secondary_key: encryptSecret(input.secondary_key || ""),
    },
    connected: Boolean(input.connected),
    last_test_status: input.last_test_status || null,
    last_test_message: input.last_test_message || null,
    updated_at: new Date().toISOString(),
  };

  const existing = (await getAdminDb().select<{ id: string }>("affiliate_partner_accounts", {
    select: "id",
    partner_id: `eq.${input.partner_id}`,
    platform: `eq.${input.platform}`,
    limit: "1",
  }))[0];

  if (existing?.id) return getAdminDb().update("affiliate_partner_accounts", { id: existing.id }, payload);
  return getAdminDb().insert("affiliate_partner_accounts", payload);
}

export async function saveAffiliateProviderTestResult(account: AffiliateProviderAccount, connected: boolean, status: "success" | "error", message: string) {
  return saveAffiliateProviderAccount({
    partner_id: account.partner_id,
    platform: account.platform,
    primary_key: account.credentials?.primary_key || "",
    secondary_key: account.credentials?.secondary_key || "",
    connected,
    last_test_status: status,
    last_test_message: message,
  });
}
