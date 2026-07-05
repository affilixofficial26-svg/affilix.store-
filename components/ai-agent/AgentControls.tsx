export function AgentControls() {
  return (
    <form action="/api/ai/agent" method="post" className="grid gap-2">
      <button type="submit" className="btn btn-primary" data-help="Ejecuta el ciclo completo: descubrir productos, generar contenido, publicar y registrar logs." name="action" value="run_full_cycle">Ejecutar ciclo completo</button>
      <button type="submit" className="btn" data-help="Solo busca productos nuevos según nichos y plataformas conectadas." name="action" value="discover_products">Descubrir productos</button>
    </form>
  );
}
