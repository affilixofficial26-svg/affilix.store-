# Migration Notes

## Aplicar en Supabase

Ejecutar `supabase/migrations/015_affilix_digital_hub.sql`.

## Compatibilidad

No se eliminaron tablas ni endpoints antiguos. El modelo viejo queda fuera de la navegacion principal, pero disponible mientras se valida la migracion.

## Orden recomendado

1. Aplicar migracion 015.
2. Revisar RLS y buckets.
3. Configurar variables.
4. Crear productos reales.
5. Probar checkout y webhook.
6. Probar entrega con archivo privado.
