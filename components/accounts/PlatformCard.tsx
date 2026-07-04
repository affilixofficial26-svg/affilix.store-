export function PlatformCard({ platform }: { platform: string }) {
  return <div className="surface p-4"><h3 className="font-display text-xl font-bold capitalize">{platform}</h3><p className="text-sm text-[var(--text-secondary)]">Conecta credenciales reales desde Cuentas.</p></div>;
}
