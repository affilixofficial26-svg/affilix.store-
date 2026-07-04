export function AgentChat() {
  return (
    <form action="/api/ai/chat" method="post" className="space-y-3">
      <textarea className="input min-h-32 py-3" data-help="Escribe una orden para el agente IA. Ejemplo: analiza un nicho o prepara contenido para productos." name="message" required />
      <button className="btn btn-primary" data-help="Envía la instrucción al agente IA." type="submit">Enviar</button>
    </form>
  );
}
