import { getLocalPlatformAccounts } from "@/lib/local-platform-accounts";
import { decryptSecret, encryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import type { Platform } from "@/types";

export type ProviderAccount = {
  id?: string;
  platform: Platform;
  connected: boolean;
  connection_method: "external_login" | "manual_credentials";
  signup_url?: string;
  credentials?: {
    primary_key?: string;
    secondary_key?: string;
  };
  last_test_status: "success" | "error" | null;
  last_test_message: string | null;
  updated_at: string;
};

type StoredProviderAccount = {
  id?: string;
  platform: Platform;
  credentials?: {
    primary_key?: string;
    secondary_key?: string;
  };
  connected?: boolean;
  last_test_status: "success" | "error" | null;
  last_test_message: string | null;
  updated_at?: string;
};

function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function fromStoredProviderAccount(account: StoredProviderAccount): ProviderAccount {
  return {
    id: account.id,
    platform: account.platform,
    connected: Boolean(account.connected),
    connection_method: "manual_credentials",
    credentials: {
      primary_key: decryptSecret(account.credentials?.primary_key),
      secondary_key: decryptSecret(account.credentials?.secondary_key),
    },
    last_test_status: account.last_test_status,
    last_test_message: account.last_test_message,
    updated_at: account.updated_at || new Date().toISOString(),
  };
}

export async function getProviderAccounts() {
  if (hasSupabase()) {
    const rows = await getAdminDb().select<StoredProviderAccount>("platform_accounts", {
      select: "id,platform,credentials,connected,last_test_status,last_test_message,updated_at",
      user_id: "is.null",
      order: "updated_at.desc",
      limit: "80",
    });
    const deduped = new Map<Platform, ProviderAccount>();
    rows.map(fromStoredProviderAccount).forEach((account) => {
      if (!deduped.has(account.platform)) deduped.set(account.platform, account);
    });
    return Array.from(deduped.values());
  }

  return getLocalPlatformAccounts();
}

export async function getProviderAccountMap() {
  const accounts = await getProviderAccounts();
  return new Map(accounts.map((account) => [account.platform, account]));
}

export async function saveProviderAccountResult(account: ProviderAccount, connected: boolean, status: "success" | "error", message: string) {
  const payload = {
    user_id: null,
    platform: account.platform,
    credentials: {
      primary_key: encryptSecret(account.credentials?.primary_key || ""),
      secondary_key: encryptSecret(account.credentials?.secondary_key || ""),
    },
    connected,
    last_test_status: status,
    last_test_message: message,
    updated_at: new Date().toISOString(),
  };

  if (hasSupabase()) {
    const rows = await getAdminDb().select<StoredProviderAccount>("platform_accounts", {
      select: "id",
      platform: `eq.${account.platform}`,
      user_id: "is.null",
      order: "updated_at.desc",
      limit: "1",
    });
    if (rows[0]?.id) return getAdminDb().update("platform_accounts", { id: rows[0].id }, payload);
    return getAdminDb().insert("platform_accounts", payload);
  }

  const { saveLocalPlatformAccount } = await import("@/lib/local-platform-accounts");
  return saveLocalPlatformAccount({
    platform: account.platform,
    connected,
    connection_method: account.connection_method,
    signup_url: account.signup_url,
    credentials: account.credentials,
    last_test_status: status,
    last_test_message: message,
  });
}
