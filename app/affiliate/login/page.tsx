import Image from "next/image";

export default async function AffiliateLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const errors: Record<string, string> = {
    invalid: "Completa correo y contrasena correctamente.",
    locked: "Demasiados intentos fallidos. Intenta otra vez en 15 minutos.",
    wrong: "Correo o contrasena de afiliado incorrectos.",
  };
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <form action="/api/affiliate/auth/login" method="post" className="auth-card surface space-y-4 p-7 shadow-2xl shadow-black/30">
          <div>
            <Image className="mx-auto h-36 w-36 rounded-full object-cover shadow-2xl shadow-black/40" src="/affilix-partners-logo.png" alt="AFFILIX Partners" width={144} height={144} />
            <h1 className="font-display mt-6 text-2xl font-bold">Acceso afiliado</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Entra con una cuenta afiliada para abrir su dashboard privado. El panel administrador se gestiona aparte desde el acceso oficial.
            </p>
          </div>
          {params.error ? (
            <div className="rounded-lg border border-[rgba(239,68,68,.35)] bg-[rgba(239,68,68,.08)] p-3 text-sm text-red-200">
              {errors[params.error] || "No se pudo iniciar sesion."}
            </div>
          ) : null}
          <input className="input" name="email" type="email" placeholder="Correo afiliado" required />
          <input className="input" name="password" type="password" placeholder="Contrasena" required />
          <button className="btn btn-primary w-full" type="submit">Entrar</button>
          <p className="text-xs leading-5 text-[var(--text-muted)]">
            Este acceso no abre el panel admin. Cada afiliado solo ve sus productos, su web, sus clicks y sus comisiones.
          </p>
        </form>
      </div>
    </main>
  );
}
