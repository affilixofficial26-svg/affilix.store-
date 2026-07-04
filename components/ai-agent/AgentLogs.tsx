export function AgentLogs({ logs = [] }: { logs?: Array<{ action: string; status: string }> }) {
  return (
    <div className="space-y-2" data-help="Logs del agente: sirven para revisar qué hizo, si terminó bien o si hubo errores.">
      {logs.map((log) => <div key={`${log.action}-${log.status}`} className="surface p-3 text-sm">{log.action} · {log.status}</div>)}
    </div>
  );
}
