CREATE TABLE IF NOT EXISTS live_test_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('owner','support','affiliate','customer')),
  store_slug text,
  is_test boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suite text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','passed','failed','fixed','skipped','blocked')),
  title text NOT NULL,
  description text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_tests integer NOT NULL DEFAULT 0,
  passed_tests integer NOT NULL DEFAULT 0,
  failed_tests integer NOT NULL DEFAULT 0,
  fixed_tests integer NOT NULL DEFAULT 0,
  skipped_tests integer NOT NULL DEFAULT 0,
  pending_tests integer NOT NULL DEFAULT 0,
  muapi_cost_usd numeric(12,4) NOT NULL DEFAULT 0,
  emails_sent integer NOT NULL DEFAULT 0,
  test_orders_created integer NOT NULL DEFAULT 0,
  test_deliveries_created integer NOT NULL DEFAULT 0,
  report_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_test boolean NOT NULL DEFAULT true,
  created_by text DEFAULT 'codex-live-tests',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_test_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES live_test_runs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','passed','failed','fixed','skipped','blocked')),
  test_name text NOT NULL,
  panel text NOT NULL,
  actor text NOT NULL,
  route text,
  action_label text,
  evidence_url text,
  screenshot_path text,
  trace_path text,
  logs_path text,
  error_message text,
  fix_summary text,
  data_created jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_test_runs_created_at ON live_test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_test_runs_suite ON live_test_runs(suite);
CREATE INDEX IF NOT EXISTS idx_live_test_steps_run_id ON live_test_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_live_test_steps_status ON live_test_steps(status);

ALTER TABLE live_test_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_test_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_live_test_actors ON live_test_actors;
CREATE POLICY service_role_live_test_actors ON live_test_actors FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_live_test_runs ON live_test_runs;
CREATE POLICY service_role_live_test_runs ON live_test_runs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_live_test_steps ON live_test_steps;
CREATE POLICY service_role_live_test_steps ON live_test_steps FOR ALL
  TO service_role USING (true) WITH CHECK (true);

INSERT INTO live_test_actors (email, role, store_slug, is_test, metadata)
VALUES
  ('admin-test@affilix.local', 'owner', NULL, true, '{"name":"Admin owner test"}'::jsonb),
  ('support-test@affilix.local', 'support', NULL, true, '{"name":"Admin support test"}'::jsonb),
  ('afiliado-test@affilix.local', 'affiliate', 'creativa-digital-pro', true, '{"name":"Afiliado test"}'::jsonb),
  ('cliente-test@affilix.local', 'customer', NULL, true, '{"name":"Cliente test"}'::jsonb)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  store_slug = EXCLUDED.store_slug,
  is_test = true,
  metadata = EXCLUDED.metadata,
  updated_at = now();
