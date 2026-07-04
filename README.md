# AFFILIX

Sistema automatizado de afiliados con IA multi-provider, Next.js 14, Supabase, Redis, tracking `/go/[slug]`, tienda pública y cron jobs para Vercel.

## Requisitos

- Node.js 20+
- Proyecto Supabase con la migración `supabase/migrations/001_initial_schema.sql`
- Upstash Redis para cache/rate limit de APIs externas
- Credenciales reales de Amazon PA API, ClickBank o CJ por usuario
- Provider IA por usuario: OpenAI, Anthropic, Groq, Mistral u Ollama local

## Instalación

1. Ejecuta `npm install`.
2. Copia `.env.local.example` a `.env.local` y rellena Supabase, Redis, `CRON_SECRET` y `NEXT_PUBLIC_APP_URL`.
3. Aplica la migración SQL en Supabase.
4. Ejecuta `npm run dev`.
5. Entra en `/dashboard/accounts` y `/dashboard/settings/ai-config` para conectar cuentas.

## Rutas clave

- `/dashboard`: KPIs reales desde Supabase.
- `/dashboard/products`: catálogo de productos afiliados.
- `/dashboard/ai-agent`: controles del agente.
- `/store`: tienda pública.
- `/go/[slug]`: registra click y redirige al enlace afiliado real.
- `/api/amazon/search`, `/api/clickbank/marketplace`, `/api/cj/products`: conectores externos.
- `/api/automation/cron-*`: cron jobs protegidos por `CRON_SECRET`.

## Producción

Configura las variables en Vercel y despliega con `vercel --prod`. Las cron jobs quedan definidas en `vercel.json`.
