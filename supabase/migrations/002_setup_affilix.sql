DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'platform_accounts'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%platform%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE platform_accounts DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE platform_accounts
    ADD CONSTRAINT platform_accounts_platform_check
    CHECK (platform IN ('amazon', 'ebay', 'rakuten', 'clickbank', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'shopify', 'etsy'));

  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'affiliate_products'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%platform%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE affiliate_products DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE affiliate_products
    ADD CONSTRAINT affiliate_products_platform_check
    CHECK (platform IN ('amazon', 'ebay', 'rakuten', 'clickbank', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'shopify', 'etsy'));
END $$;

CREATE TABLE IF NOT EXISTS platform_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_key TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'ebay', 'rakuten', 'clickbank', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'shopify', 'etsy')),
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setup_key, platform)
);

CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_key TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL CHECK (automation_id IN ('auto_discover', 'auto_prices', 'auto_content', 'auto_seo', 'auto_new_releases', 'auto_commissions', 'auto_master_agent')),
  enabled BOOLEAN DEFAULT true,
  schedule_cron TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setup_key, automation_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_setup_progress_key ON platform_setup_progress(setup_key);
CREATE INDEX IF NOT EXISTS idx_automation_settings_key ON automation_settings(setup_key);

ALTER TABLE platform_setup_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_own_platform_setup ON platform_setup_progress;
DROP POLICY IF EXISTS users_own_automation_settings ON automation_settings;

CREATE POLICY users_own_platform_setup ON platform_setup_progress FOR ALL USING (auth.uid() = user_id OR setup_key = 'default');
CREATE POLICY users_own_automation_settings ON automation_settings FOR ALL USING (auth.uid() = user_id OR setup_key = 'default');
