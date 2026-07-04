CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error','critical')),
  module TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  actor_id UUID,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('stripe','paypal','meta','muapi','resend','other')),
  event_type TEXT,
  event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  signature_valid BOOLEAN,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_detail TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed','timeout')),
  duration_ms INTEGER,
  error_detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level_date ON system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_module_date ON system_logs(module, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_webhook_provider_event ON webhook_logs(provider, event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_date ON cron_logs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON admin_user_roles(user_id);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_system_logs ON system_logs;
CREATE POLICY service_role_system_logs ON system_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_webhook_logs ON webhook_logs;
CREATE POLICY service_role_webhook_logs ON webhook_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_cron_logs ON cron_logs;
CREATE POLICY service_role_cron_logs ON cron_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_admin_roles ON admin_roles;
CREATE POLICY service_role_admin_roles ON admin_roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_admin_user_roles ON admin_user_roles;
CREATE POLICY service_role_admin_user_roles ON admin_user_roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_admin_role_permissions ON admin_role_permissions;
CREATE POLICY service_role_admin_role_permissions ON admin_role_permissions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO admin_roles (name, description) VALUES
  ('owner','Acceso total a AFFILIX'),
  ('operations','Gestiona catalogo, pedidos y entregas'),
  ('support','Soporte y lectura operativa'),
  ('marketing','Marketing, campanas y contenido')
ON CONFLICT (name) DO NOTHING;

WITH owner_role AS (SELECT id FROM admin_roles WHERE name = 'owner')
INSERT INTO admin_role_permissions (role_id, permission)
SELECT owner_role.id, permission
FROM owner_role, unnest(ARRAY[
  'catalog.publish','catalog.unpublish','catalog.delete',
  'orders.charge','orders.refund','orders.cancel',
  'service_runs.approve','affiliates.payout',
  'agents.run_high_cost','marketing.meta_publish',
  'security.rotate_secrets','security.raw_sql','data.delete'
]) AS permission
ON CONFLICT DO NOTHING;

WITH ops_role AS (SELECT id FROM admin_roles WHERE name = 'operations')
INSERT INTO admin_role_permissions (role_id, permission)
SELECT ops_role.id, permission
FROM ops_role, unnest(ARRAY[
  'catalog.publish','catalog.unpublish',
  'orders.charge','orders.refund','orders.cancel',
  'service_runs.approve'
]) AS permission
ON CONFLICT DO NOTHING;

WITH marketing_role AS (SELECT id FROM admin_roles WHERE name = 'marketing')
INSERT INTO admin_role_permissions (role_id, permission)
SELECT marketing_role.id, 'marketing.meta_publish'
FROM marketing_role
ON CONFLICT DO NOTHING;
