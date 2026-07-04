CREATE TABLE IF NOT EXISTS affiliate_meta_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  access_token TEXT,
  ad_account_id TEXT,
  page_id TEXT,
  pixel_id TEXT,
  connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id)
);

CREATE TABLE IF NOT EXISTS affiliate_meta_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  source_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  meta_account_mode TEXT NOT NULL CHECK (meta_account_mode IN ('affilix_main','affiliate_own')),
  budget_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  destination_url TEXT NOT NULL,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  status TEXT DEFAULT 'paused' CHECK (status IN ('requested','paused','active','error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_meta_promotions_partner ON affiliate_meta_promotions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_meta_promotions_product ON affiliate_meta_promotions(source_product_id);

ALTER TABLE affiliate_meta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_meta_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_affiliate_meta_accounts ON affiliate_meta_accounts;
CREATE POLICY service_role_affiliate_meta_accounts ON affiliate_meta_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_affiliate_meta_promotions ON affiliate_meta_promotions;
CREATE POLICY service_role_affiliate_meta_promotions ON affiliate_meta_promotions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
