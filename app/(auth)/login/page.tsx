import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/dashboard";
  const errors: Record<string, string> = {
    invalid: "Completa correo y contrasena correctamente.",
    locked: "Demasiados intentos fallidos. Intenta otra vez en 15 minutos.",
    not_configured: "El acceso administrador no esta configurado en produccion.",
    wrong: "Correo o contrasena de administrador incorrectos.",
    google: "No se pudo iniciar sesion con Google. Verifica que el correo este autorizado.",
  };
  return (
    <form action="/api/auth/login" method="post" className="auth-card surface space-y-4 p-7 shadow-2xl shadow-black/30" data-help="Acceso privado al panel administrador de AFFILIX. Usa las credenciales configuradas en .env.local.">
        <input type="hidden" name="redirect" value={redirectTo} />
        <div>
          <Image src="/brand/ui/login-logo.png" alt="AFFILIX Digital Hub" width={900} height={450} className="mx-auto h-24 w-auto object-contain" priority />
          <h1 className="font-display mt-6 text-2xl font-bold">Acceso administrador</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Entra con el correo y contrasena de administrador.
          </p>
        </div>
        {params.error ? (
          <div className="rounded-lg border border-[rgba(239,68,68,.35)] bg-[rgba(239,68,68,.08)] p-3 text-sm text-red-200">
            {errors[params.error] || errors.google}
          </div>
        ) : null}
        <input className="input" title="Correo administrador configurado en ADMIN_EMAIL." name="email" type="email" placeholder="Correo administrador" required />
        <input className="input" title="Contrasena configurada en ADMIN_PASSWORD." name="password" type="password" placeholder="Contrasena" required />
        <button className="btn btn-primary w-full" data-help="Valida tus credenciales y abre el dashboard." type="submit">Entrar como administrador</button>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span>o</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <a className="btn w-full" href={`/api/auth/google/start?redirect=${encodeURIComponent(redirectTo)}`}>
          Entrar con Google
        </a>
    </form>
  );
}
