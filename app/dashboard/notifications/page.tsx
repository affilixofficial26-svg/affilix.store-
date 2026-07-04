import { getAdminDb } from "@/lib/supabase";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  actor_type: string | null;
  actor_id: string | null;
  actor_name: string | null;
  read: boolean;
  created_at: string;
};

function typeLabel(type: string) {
  if (type.includes("sale")) return "Venta";
  if (type.includes("click")) return "Click";
  if (type.includes("login")) return "Acceso";
  if (type.includes("registered")) return "Registro";
  if (type.includes("meta")) return "Meta";
  return "Sistema";
}

function typeTone(type: string) {
  if (type.includes("sale")) return "bg-emerald-500/15 text-emerald-300";
  if (type.includes("click")) return "bg-sky-500/15 text-sky-300";
  if (type.includes("login")) return "bg-purple-500/15 text-purple-300";
  if (type.includes("registered")) return "bg-amber-500/15 text-amber-200";
  return "bg-white/10 text-[var(--text-secondary)]";
}

export default async function AdminNotificationsPage() {
  let notifications: AdminNotification[] = [];
  let errorMessage = "";
  try {
    notifications = await getAdminDb().select<AdminNotification>("admin_notifications", { select: "*", order: "created_at.desc", limit: "120" });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudieron cargar notificaciones.";
  }

  const unread = notifications.filter((item) => !item.read).length;
  const sales = notifications.filter((item) => item.type.includes("sale")).length;
  const clicks = notifications.filter((item) => item.type.includes("click")).length;
  const logins = notifications.filter((item) => item.type.includes("login")).length;

  return (
    <div className="space-y-6">
      <header className="surface p-6">
        <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">Centro de avisos</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Notificaciones administrador</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
          Aqui ves lo importante del sistema: afiliados que se registran, accesos al panel, clicks, ventas y actividad operativa de usuarios.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Sin leer</div><div className="mt-2 font-mono text-3xl">{unread}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Ventas</div><div className="mt-2 font-mono text-3xl text-emerald-300">{sales}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Clicks</div><div className="mt-2 font-mono text-3xl text-sky-300">{clicks}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Accesos</div><div className="mt-2 font-mono text-3xl text-purple-300">{logins}</div></div>
      </section>

      {errorMessage ? <div className="surface border-red-500/30 p-4 text-sm text-red-200">{errorMessage}</div> : null}

      <section className="surface overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-display text-xl font-bold">Actividad reciente</h2>
        </div>
        {notifications.length ? (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((item) => (
              <article key={item.id} className="grid gap-3 p-5 md:grid-cols-[140px_1fr_180px]">
                <div><span className={`rounded-full px-3 py-1 text-xs font-bold ${typeTone(item.type)}`}>{typeLabel(item.type)}</span></div>
                <div>
                  <h3 className="font-display text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.message}</p>
                  {item.actor_name ? <div className="mt-2 text-xs text-[var(--text-muted)]">Usuario: {item.actor_name}</div> : null}
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString("es-ES")}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Todavia no hay notificaciones administrativas.</div>
        )}
      </section>
    </div>
  );
}
