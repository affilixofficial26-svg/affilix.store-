CREATE TABLE IF NOT EXISTS affiliate_partner_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'amazon_seller', 'ebay', 'rakuten', 'clickbank', 'hotmart', 'gumroad', 'payhip', 'warriorplus', 'systeme', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'walmart', 'temu', 'shein', 'flexoffers', 'partnerstack', 'fiverr', 'semrush', 'hubspot', 'booking', 'agoda', 'coinbase', 'binance', 'aliexpress', 'teachable', 'shopify', 'etsy')),
  credentials JSONB NOT NULL DEFAULT '{}',
  connected BOOLEAN DEFAULT false,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'error')),
  last_test_message TEXT,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partner_accounts_partner ON affiliate_partner_accounts(partner_id);

ALTER TABLE affiliate_partner_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_affiliate_partner_accounts ON affiliate_partner_accounts;
CREATE POLICY service_role_affiliate_partner_accounts ON affiliate_partner_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
