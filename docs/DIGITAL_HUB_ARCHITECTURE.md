# Digital Hub Architecture

AFFILIX Digital Hub queda organizado en tres superficies:

1. Web publica para explorar productos digitales, servicios IA, kits, herramientas, comparadores y afiliados.
2. Dashboard administrativo con catalogo, operaciones, crecimiento, agentes, finanzas y logs.
3. Backend Next.js/Supabase para catalogo, pedidos, entregas, automatizaciones y agentes.

## Fuente de datos principal

- `catalog_items`: item vendible principal.
- `customer_orders`: pedidos.
- `deliveries` y `download_tokens`: entregas.
- `ai_agents`, `ai_agent_runs`, `ai_agent_logs`: agentes.
- `finance_events`: finanzas.

## Reglas operativas

- No se muestran ventas inventadas.
- Si no hay datos, se muestran ceros o estados vacios.
- Si falta una API key, el modulo queda en pendiente de configuracion.
- Los archivos digitales deben vivir en storage privado y entregarse con signed URL.
