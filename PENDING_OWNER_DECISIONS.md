# PENDING OWNER DECISIONS

Fecha: 2026-07-05

## 1. GitHub

Bloqueado por permisos. El repo destino es:

`https://github.com/affilixofficial26-svg/affilix.store-.git`

El push falla porque la cuenta autenticada localmente es `yankyfilms-alt` y GitHub devuelve 403.

Opciones:

### Opcion A: PAT de la cuenta dueña

1. Entrar en GitHub como `affilixofficial26-svg`.
2. Crear Fine-grained Personal Access Token para solo `affilix.store-`.
3. Permisos: Contents Read/Write, Metadata Read, Workflows Read/Write.
4. Ejecutar:

```powershell
git config user.name "affilixofficial26-svg"
git config user.email "affilixofficial26-svg@users.noreply.github.com"
git remote set-url origin https://github.com/affilixofficial26-svg/affilix.store-.git
git branch -M main
git push -u origin main
```

Cuando pida usuario: `affilixofficial26-svg`.
Cuando pida password: pegar el PAT.

### Opcion B: añadir colaborador

Añadir `yankyfilms-alt` como colaborador Write en el repo y ejecutar:

```powershell
git push -u origin main
```

### Opcion C: transferir repo

Transferir `affilixofficial26-svg/affilix.store-` a `yankyfilms-alt` y cambiar el remote.

## 2. Vercel Git

Después del primer push:

1. Vercel -> AFFILIX -> Settings -> Git.
2. Conectar `affilixofficial26-svg/affilix.store-`.
3. Rama: `main`.
4. Confirmar que las variables Production siguen presentes.
5. Hacer un deploy manual.

## 3. QStash

Faltan credenciales del owner:

- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

El código ya soporta verificación QStash con fallback a `CRON_SECRET`.

Schedules a crear en Upstash QStash:

| URL | Cron |
|---|---|
| `https://affilix.es/api/internal/muapi/poll-pending` | `* * * * *` |
| `https://affilix.es/api/internal/email/process-queue` | `* * * * *` |
| `https://affilix.es/api/internal/service-runs/process` | `* * * * *` |
| `https://affilix.es/api/internal/content/publish-due` | `*/5 * * * *` |
| `https://affilix.es/api/internal/cart/recover` | `*/15 * * * *` |
| `https://affilix.es/api/internal/finance/refresh-kpis` | `*/15 * * * *` |

## 4. Resend

Falta confirmación manual en Resend:

- Dominio verificado.
- SPF/DKIM/DMARC OK.
- Test recibido en bandeja real.

## 5. Pruebas con gasto real

Pendiente de autorización manual para consumir saldo/realizar pruebas:

- Generar imagen, video y audio MuAPI reales.
- Compra E2E con Stripe en modo test si se configuran claves test, o con producto de prueba si se mantiene live.
