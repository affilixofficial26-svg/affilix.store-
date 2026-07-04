# Recordatorio de autenticación

Hay un login local de administrador activo usando `ADMIN_EMAIL` y `ADMIN_PASSWORD`
desde `.env.local`.

Antes de publicar en producción:

1. Migrar el administrador a Supabase Auth.
2. Mantener `/dashboard/*` protegido con sesiones reales.
3. Cambiar `/auth`, `/login` y `/register` para usar Supabase Auth.
4. Crear perfiles reales en `user_profiles` al registrarse.
