export function CampaignBuilder() {
  return <form action="/api/automation/run" method="post" className="surface grid gap-3 p-4" data-help="Constructor rápido de campañas. Guarda una campaña para que el sistema la ejecute por automatización."><input className="input" data-help="Nombre interno de la campaña automática." name="name" required /><button className="btn btn-primary" data-help="Guarda la campaña y la registra para automatización.">Guardar</button></form>;
}
