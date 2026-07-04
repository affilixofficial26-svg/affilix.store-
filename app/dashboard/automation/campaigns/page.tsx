export default function CampaignsPage() {
  return (
    <div className="surface p-6">
      <h1 className="font-display text-3xl font-bold">Campañas automáticas</h1>
      <form action="/api/automation/run" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="input" name="name" placeholder="Nombre de campaña" required />
        <input className="input" name="schedule_cron" placeholder="0 9 * * *" required />
        <textarea className="input min-h-32 py-3 md:col-span-2" name="description" placeholder="Descripción" />
        <button className="btn btn-primary md:col-span-2" type="submit">Guardar campaña</button>
      </form>
    </div>
  );
}
