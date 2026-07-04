ALTER TABLE affiliate_partners
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'not_configured' CHECK (domain_status IN ('not_configured', 'pending_dns', 'connected')),
  ADD COLUMN IF NOT EXISTS domain_notes TEXT,
  ADD COLUMN IF NOT EXISTS promotion_goal_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_goal_sales INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_goal_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_close_requested_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS affiliate_partner_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  source_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, source_product_id)
);

CREATE TABLE IF NOT EXISTS affiliate_partner_promotion_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES affiliate_partner_promotions(id) ON DELETE SET NULL,
  source_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partner_promotions_partner ON affiliate_partner_promotions(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_promotions_product ON affiliate_partner_promotions(source_product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_promotion_clicks_partner ON affiliate_partner_promotion_clicks(partner_id);

ALTER TABLE affiliate_partner_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partner_promotion_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_affiliate_partner_promotions ON affiliate_partner_promotions;
CREATE POLICY service_role_affiliate_partner_promotions ON affiliate_partner_promotions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_affiliate_partner_promotion_clicks ON affiliate_partner_promotion_clicks;
CREATE POLICY service_role_affiliate_partner_promotion_clicks ON affiliate_partner_promotion_clicks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
