CREATE TABLE IF NOT EXISTS affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  payout_email TEXT,
  affiliate_commission_rate DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  owner_commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 100),
  CHECK (owner_commission_rate >= 0 AND owner_commission_rate <= 100),
  CHECK ((affiliate_commission_rate + owner_commission_rate) <= 100)
);

CREATE TABLE IF NOT EXISTS affiliate_partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  source_product_id UUID REFERENCES affiliate_products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_active BOOLEAN DEFAULT true,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, slug)
);

CREATE TABLE IF NOT EXISTS affiliate_partner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES affiliate_partner_products(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  converted BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  product_id UUID REFERENCES affiliate_partner_products(id) ON DELETE SET NULL,
  click_id UUID REFERENCES affiliate_partner_clicks(id) ON DELETE SET NULL,
  order_id TEXT,
  gross_sale_amount DECIMAL(10,2),
  total_commission_amount DECIMAL(10,2) NOT NULL,
  affiliate_commission_amount DECIMAL(10,2) NOT NULL,
  owner_commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partners_slug ON affiliate_partners(store_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_products_partner ON affiliate_partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_products_slug ON affiliate_partner_products(partner_id, slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_clicks_partner ON affiliate_partner_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partner_commissions_partner ON affiliate_partner_commissions(partner_id);

ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_affiliate_partners ON affiliate_partners;
DROP POLICY IF EXISTS service_role_affiliate_partner_products ON affiliate_partner_products;
DROP POLICY IF EXISTS service_role_affiliate_partner_clicks ON affiliate_partner_clicks;
DROP POLICY IF EXISTS service_role_affiliate_partner_commissions ON affiliate_partner_commissions;
