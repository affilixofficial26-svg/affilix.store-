export function AutomationSwitch({ name, description }: { name: string; description: string }) {
  return (
    <label className="surface flex items-center justify-between gap-4 p-4" data-help={`Automatización: ${description}`}>
      <span><strong>{name}</strong><span className="block text-sm text-[var(--text-secondary)]">{description}</span></span>
      <input type="checkbox" aria-label={`Activar ${name}`} />
    </label>
  );
}
