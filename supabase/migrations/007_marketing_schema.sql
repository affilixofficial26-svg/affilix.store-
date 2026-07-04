CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES affiliate_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  facebook_post TEXT,
  instagram_caption TEXT,
  pinterest_description TEXT,
  twitter_post TEXT,
  meta_ad_variants JSONB DEFAULT '[]',
  priority_score DECIMAL(4,2) DEFAULT 5,
  content_status TEXT DEFAULT 'pending' CHECK (content_status IN ('pending','generating','ready','published','error')),
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  facebook_page_id TEXT,
  facebook_page_token TEXT,
  instagram_business_id TEXT,
  instagram_token TEXT,
  pinterest_token TEXT,
  pinterest_board_id TEXT,
  twitter_bearer_token TEXT,
  twitter_api_key TEXT,
  twitter_api_secret TEXT,
  twitter_access_token TEXT,
  twitter_access_secret TEXT,
  facebook_enabled BOOLEAN DEFAULT false,
  instagram_enabled BOOLEAN DEFAULT false,
  pinterest_enabled BOOLEAN DEFAULT false,
  twitter_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS meta_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  ad_account_id TEXT,
  page_id TEXT,
  pixel_id TEXT,
  monthly_budget DECIMAL(10,2) DEFAULT 50,
  auto_distribute BOOLEAN DEFAULT true,
  min_priority_score DECIMAL(4,2) DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS meta_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES affiliate_products(id),
  user_id UUID REFERENCES user_profiles(id),
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  daily_budget DECIMAL(10,2),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,
  roas DECIMAL(8,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES affiliate_products(id),
  user_id UUID REFERENCES user_profiles(id),
  platform TEXT CHECK (platform IN ('facebook','instagram','pinterest','twitter','meta_ads')),
  platform_post_id TEXT,
  status TEXT CHECK (status IN ('success','error','pending')),
  error_message TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_content_own ON marketing_content;
DROP POLICY IF EXISTS social_accounts_own ON social_accounts;
DROP POLICY IF EXISTS meta_config_own ON meta_config;
DROP POLICY IF EXISTS meta_campaigns_own ON meta_campaigns;
DROP POLICY IF EXISTS publish_log_own ON publish_log;

CREATE POLICY marketing_content_own ON marketing_content FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY social_accounts_own ON social_accounts FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY meta_config_own ON meta_config FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY meta_campaigns_own ON meta_campaigns FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY publish_log_own ON publish_log FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_marketing_content_product ON marketing_content(product_id);
CREATE INDEX IF NOT EXISTS idx_publish_log_product ON publish_log(product_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_product ON meta_campaigns(product_id);
