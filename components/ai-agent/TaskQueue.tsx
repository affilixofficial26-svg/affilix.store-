export function TaskQueue({ tasks = [] }: { tasks?: string[] }) {
  return <div className="space-y-2" data-help="Cola de tareas pendientes o en proceso del agente IA.">{tasks.map((task) => <div key={task} className="surface p-3 text-sm">{task}</div>)}</div>;
}
