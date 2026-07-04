# Cleanup Report

## Limpieza aplicada

- La home `/` dejo de redirigir al dashboard y ahora presenta AFFILIX Digital Hub como web publica.
- El sidebar del dashboard se reemplazo por navegacion agrupada del nuevo modelo digital.
- Se retiraron del sidebar principal proveedores fisicos, Amazon, descubiertas fisicas y Affiliate Scout antiguo.
- El color primario paso de dorado a gradiente azul/violeta/cian.
- Se instalo `lucide-react` para iconografia profesional.

## Archivos movidos

- No se movieron archivos legacy para evitar romper dependencias existentes.

## Rutas retiradas del foco principal

- `/dashboard/providers`.
- `/dashboard/products`.
- `/dashboard/products/discover`.
- `/dashboard/affiliate-scout`.

## Rutas nuevas creadas

- `/dashboard/digital-products`.
- `/dashboard/ai-services`.
- `/dashboard/business-kits`.
- `/dashboard/comparator`.
- `/dashboard/niche-factory`.
- `/dashboard/deliveries`.
- `/dashboard/agents`.
- `/dashboard/finance`.
- `/dashboard/logs`.

## Pendientes

- Convertir endpoints legacy de marketplaces fisicos en carpeta `legacy` si se confirma que no se necesitan.
- Conectar acciones avanzadas de agentes a backend seguro despues de configurar proveedor IA.
- Activar pagos, storage privado y correo transaccional.
