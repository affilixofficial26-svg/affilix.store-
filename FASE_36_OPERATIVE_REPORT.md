# FASE 36 OPERATIVE REPORT

Fecha: 2026-07-05
Dominio: `https://affilix.es`
Supabase project: `ilsgcxfzpplyqymzauaa`

## Bloque 1 - GitHub

Estado: BLOQUEADO POR OWNER.

Resultado real:

```text
remote: Permission to affilixofficial26-svg/affilix.store-.git denied to yankyfilms-alt.
fatal: unable to access ... 403
```

Acción aplicada:

- Se documentaron las opciones A/B/C en `PENDING_OWNER_DECISIONS.md`.
- El repo local tiene commits listos en `main`.

## Bloque 2 - Cron cada minuto con QStash

Estado: CÓDIGO LISTO, ALTA QSTASH PENDIENTE.

Aplicado:

- Instalada dependencia `@upstash/qstash`.
- Añadido verificador en `lib/qstash/verify.ts`.
- Los endpoints internos aceptan firma QStash o `CRON_SECRET`.
- Añadidos endpoints:
  - `/api/internal/email/process-queue`
  - `/api/internal/service-runs/process`
  - `/api/internal/content/publish-due`
  - `/api/internal/cart/recover`
  - `/api/internal/finance/refresh-kpis`
- `vercel.json` queda solo con crons compatibles con Hobby.

Pendiente owner:

- Crear cuenta QStash y añadir variables.
- Crear los 6 schedules indicados en `PENDING_OWNER_DECISIONS.md`.

## Bloque 3 - MuAPI real

Estado: INFRAESTRUCTURA VERDE, GENERACIONES REALES PENDIENTES DE EJECUCIÓN MANUAL/AUTORIZACIÓN.

Verificado:

- `/api/health` reportó MuAPI `ready: true`.
- Balance MuAPI reportado por health: `10 USD`.
- `/api/muapi/models` devuelve catálogo real desde Supabase.
- `/dashboard/media-studio` y `/dashboard/media-studio/jobs` existen.

Pendiente:

- Ejecutar 3 jobs reales: imagen, video y audio.
- Confirmar `stored_asset_ids`, `storage.objects` y `finance_events`.

## Bloque 4 - Compra E2E

Estado: PENDIENTE DE CONFIGURAR MODO TEST O AUTORIZAR PRUEBA LIVE.

Motivo:

- Production tiene Stripe live.
- No se cambió a test sin autorización explícita para evitar afectar cobros reales.

## Bloque 5 - Resend

Estado: PENDIENTE DE VERIFICACIÓN EXTERNA.

Motivo:

- Requiere acceso al panel Resend y confirmación de bandeja real.

## Bloque 6 - Revisiones

Estado: EJECUTADAS A NIVEL HTTP/API; revisión visual completa queda pendiente de sesión autenticada y screenshots manuales.

Resultados principales:

- `npm run build`: OK.
- `supabase migration list`: local y remoto hasta `019`.
- `.next/static` sin coincidencias de secretos (`MUAPI_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- `GET /api/health`: OK en producción antes de este bloque.
- Admin sin sesión devuelve `307` a login, comportamiento esperado.

## Notas técnicas

- Vercel Hobby no permite crons por minuto; por eso se implementó QStash.
- No se imprimen secretos en reportes.
- GitHub no queda cerrado hasta que el owner resuelva permisos.
