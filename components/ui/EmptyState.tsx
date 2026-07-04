import Link from "next/link";
import { AffilixLogo } from "@/components/brand/AffilixLogo";

export function EmptyState({ title, message, actionHref, actionLabel }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="surface fade-up flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
      <AffilixLogo compact className="mb-4 h-12 w-12" />
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">{message}</p>
      {actionHref && actionLabel ? (
        <Link className="btn btn-primary mt-5" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
