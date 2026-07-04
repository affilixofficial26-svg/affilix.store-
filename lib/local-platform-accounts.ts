import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { decryptSecret, encryptSecret } from "@/lib/security";
import type { Platform } from "@/types";

export interface LocalPlatformAccount {
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
}

const configDir = path.join(process.cwd(), "data");
const accountsPath = path.join(configDir, "local-platform-accounts.json");

export async function getLocalPlatformAccounts() {
  return readLocalPlatformAccounts();
}

async function readLocalPlatformAccounts() {
  try {
    const file = await readFile(accountsPath, "utf8");
    const accounts = JSON.parse(file) as LocalPlatformAccount[];
    return accounts.map((account) => ({
      ...account,
      credentials: account.credentials ? {
        primary_key: decryptSecret(account.credentials.primary_key),
        secondary_key: decryptSecret(account.credentials.secondary_key),
      } : undefined,
    }));
  } catch {
    return [];
  }
}

export async function saveLocalPlatformAccount(account: Omit<LocalPlatformAccount, "updated_at">) {
  const current = await readLocalPlatformAccounts();
  const nextAccount: LocalPlatformAccount = {
    ...account,
    credentials: account.credentials ? {
      primary_key: encryptSecret(account.credentials.primary_key),
      secondary_key: encryptSecret(account.credentials.secondary_key),
    } : undefined,
    updated_at: new Date().toISOString(),
  };
  const next = [nextAccount, ...current.filter((item) => item.platform !== account.platform)];

  await mkdir(configDir, { recursive: true });
  await writeFile(accountsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return nextAccount;
}

export function getLocalPlatformAccountMap(accounts: LocalPlatformAccount[]) {
  return new Map(accounts.map((account) => [account.platform, account]));
}
