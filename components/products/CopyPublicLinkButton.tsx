"use client";

import { useState } from "react";

export function CopyPublicLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="btn w-full" type="button" onClick={copyLink}>
      {copied ? "Enlace copiado" : "Copiar enlace publico"}
    </button>
  );
}
