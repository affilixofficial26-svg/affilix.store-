"use client";

import type { Platform } from "@/types";

type ExternalPlatformConnectFormProps = {
  platform: Platform;
  platformName: string;
  signupUrl: string;
  label?: string;
};

export function ExternalPlatformConnectForm({
  platform,
  platformName,
  signupUrl,
  label = "Entrar / registrarme",
}: ExternalPlatformConnectFormProps) {
  const providerHost = new URL(signupUrl).hostname.replace(/^www\./, "");

  return (
    <form action="/api/accounts/connect" method="post" className="mt-4 space-y-2">
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="signup_url" value={signupUrl} />
      <input type="hidden" name="connect_mode" value="external_login" />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--accent-gold)]">Web oficial</div>
        <div className="mt-1 truncate text-xs text-[var(--text-secondary)]">{providerHost}</div>
      </div>
      <button
        className="btn btn-primary w-full"
        data-help={`Guarda ${platformName} como registro abierto en AFFILIX y despues abre la web oficial del proveedor.`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
