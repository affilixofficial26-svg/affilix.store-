# AFFILIX Transformation Audit

Fecha: 2026-07-04

## Estado encontrado

- Framework: Next.js App Router con React, TypeScript y Tailwind CSS.
- Dashboard existente en `/dashboard` con sidebar, topbar, autenticacion y modulos legacy.
- Web publica nueva parcialmente creada en rutas como `/productos-digitales`, `/servicios-ia`, `/kits-negocio`, `/herramientas-ia`, `/comparador`, `/recursos`, `/afiliados`, `/p/[slug]`, `/s/[slug]`, `/kit/[slug]`, `/tools/[slug]`, `/compare/[slug]`, `/checkout/success`, `/checkout/cancel` y `/download/[token]`.
- Migracion `supabase/migrations/015_affilix_digital_hub.sql` ya existe.
- Componentes Digital Hub existentes: `PublicShell`, `CatalogPage`, `CatalogCard`, `ItemDetailPage`, `AdminCatalogList`.

## Modulos que se conservan

- Login admin y login afiliado.
- Dashboard principal.
- Sistema de afiliados.
- Analitica, marketing, automatizaciones, logs e integraciones.
- Supabase, Vercel, emails, storage y endpoints existentes.

## Modulos que salen del foco principal

- Proveedores fisicos.
- Amazon como centro del sistema.
- Descubrimiento de productos fisicos.
- Affiliate Scout antiguo.
- Rutas legacy de proveedores y productos fisicos.

## Nuevos modulos visibles en el sidebar

- Dashboard.
- Analitica.
- Finanzas.
- Catalogo Digital.
- Productos Digitales.
- Servicios IA.
- Kits de Negocio.
- Pedidos.
- Entregas.
- SaaS & Herramientas IA.
- Comparador Inteligente.
- Fabrica de Nichos.
- Afiliados.
- Marketing Automatico.
- Automatizaciones.
- Agentes IA.
- Configuracion.
- Logs del Sistema.

## Riesgos

- El entorno local usa Node 24.16.0, pero `package.json` exige Node 20.x.
- Hay endpoints legacy de marketplaces fisicos que se mantienen por compatibilidad.
- Las funciones con IA, pagos, email y storage dependen de variables externas.
- El proyecto no estaba dentro de un repositorio Git local, por lo que no se pudo crear backup con commits.

## Variables necesarias

Ver `docs/ENVIRONMENT_VARIABLES.md`.

## Tablas nuevas

La migracion `015_affilix_digital_hub.sql` concentra el modelo nuevo. Debe aplicarse en Supabase antes de operar catalogo, pedidos, entregas, agentes y logs.

## Pasos de migracion

1. Aplicar migracion `015_affilix_digital_hub.sql`.
2. Configurar variables de entorno.
3. Crear items reales en `/dashboard/catalog`.
4. Subir archivos privados antes de publicar productos descargables.
5. Activar Stripe/Resend/Storage antes de vender.
