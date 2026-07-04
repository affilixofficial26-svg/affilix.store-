ALTER TABLE digital_assets ALTER COLUMN catalog_item_id DROP NOT NULL;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT 'digital-products';
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS is_active_version BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS license_text_md TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS changelog_md TEXT;
ALTER TABLE digital_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS execution_provider TEXT NOT NULL DEFAULT 'muapi';
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS muapi_endpoint TEXT;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS muapi_model TEXT;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS input_mapping JSONB NOT NULL DEFAULT '{}';
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS estimated_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS included_revisions INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','awaiting_approval','completed','failed','cancelled')),
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  provider TEXT,
  provider_event_id TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS muapi_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('image','video','audio','enhance','edit','avatar','3d','upload')),
  input JSONB NOT NULL DEFAULT '{}',
  output_urls TEXT[],
  stored_asset_ids UUID[],
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','timeout','cancelled')),
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  origin TEXT NOT NULL CHECK (origin IN ('ai_service','agent','media_studio','marketing','affiliate_creative','manual')),
  service_run_id UUID REFERENCES service_runs(id) ON DELETE SET NULL,
  agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  user_id UUID,
  error_detail TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS muapi_models (
  slug TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL DEFAULT '{}',
  estimated_cost_usd NUMERIC(10,4),
  supports_image_input BOOLEAN NOT NULL DEFAULT false,
  supports_audio_input BOOLEAN NOT NULL DEFAULT false,
  max_duration_seconds INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW v_muapi_monthly_spend AS
SELECT
  date_trunc('month', created_at) AS month,
  COALESCE(SUM(cost_usd), 0) AS spend_usd,
  COUNT(*) AS jobs,
  COUNT(*) FILTER (WHERE status = 'completed') AS jobs_ok,
  COUNT(*) FILTER (WHERE status = 'failed') AS jobs_ko
FROM muapi_jobs
GROUP BY 1
ORDER BY 1 DESC;

CREATE INDEX IF NOT EXISTS idx_muapi_jobs_request ON muapi_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_muapi_jobs_status ON muapi_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_muapi_jobs_origin ON muapi_jobs(origin, created_at);
CREATE INDEX IF NOT EXISTS idx_muapi_jobs_service_run ON muapi_jobs(service_run_id);
CREATE INDEX IF NOT EXISTS idx_finance_events_type_date ON finance_events(type, created_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE muapi_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE muapi_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_agent_runs ON agent_runs;
CREATE POLICY service_role_agent_runs ON agent_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_marketing_campaigns ON marketing_campaigns;
CREATE POLICY service_role_marketing_campaigns ON marketing_campaigns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_finance_events ON finance_events;
CREATE POLICY service_role_finance_events ON finance_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_muapi_jobs ON muapi_jobs;
CREATE POLICY service_role_muapi_jobs ON muapi_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS read_muapi_models ON muapi_models;
CREATE POLICY read_muapi_models ON muapi_models FOR SELECT USING (true);

DROP POLICY IF EXISTS service_role_write_muapi_models ON muapi_models;
CREATE POLICY service_role_write_muapi_models ON muapi_models FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
