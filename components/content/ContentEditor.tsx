export function ContentEditor({ value = "" }: { value?: string }) {
  return <textarea className="input min-h-48 py-3" defaultValue={value} />;
}
