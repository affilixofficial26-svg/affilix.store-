CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  store_name TEXT,
  store_slug TEXT UNIQUE,
  preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  currency TEXT DEFAULT 'USD',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'anthropic', 'groq', 'mistral', 'ollama')),
  ai_model TEXT,
  ai_api_key TEXT,
  ollama_base_url TEXT,
  image_provider TEXT CHECK (image_provider IN ('openai', 'custom')),
  image_model TEXT DEFAULT 'gpt-image-1.5',
  image_api_key TEXT,
  image_base_url TEXT,
  automation_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'ebay', 'rakuten', 'clickbank', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'shopify', 'etsy')),
  credentials JSONB NOT NULL DEFAULT '{}',
  connected BOOLEAN DEFAULT false,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'error')),
  last_test_message TEXT,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE TABLE niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  avg_commission_rate DECIMAL(5,2),
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  monthly_searches INTEGER,
  trend TEXT CHECK (trend IN ('rising', 'stable', 'declining')),
  platforms TEXT[] DEFAULT '{}',
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  auto_discover BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  niche_id UUID REFERENCES niches(id),
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'ebay', 'rakuten', 'clickbank', 'digistore', 'jvzoo', 'cj', 'shareasale', 'impact', 'awin', 'spocket', 'cjdrop', 'shopify', 'etsy')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ai_title TEXT,
  ai_description TEXT,
  ai_review TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  image_source TEXT CHECK (image_source IN ('supplier', 'ai', 'manual')),
  image_prompt TEXT,
  image_generated_at TIMESTAMPTZ,
  affiliate_url TEXT NOT NULL,
  tracking_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  rating DECIMAL(3,2),
  review_count INTEGER,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  auto_published BOOLEAN DEFAULT false,
  total_clicks INTEGER DEFAULT 0,
  last_price_check TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id, user_id)
);

CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  product_id UUID REFERENCES affiliate_products(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  converted BOOLEAN DEFAULT false,
  commission_earned DECIMAL(10,2),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  product_id UUID REFERENCES affiliate_products(id),
  click_event_id UUID REFERENCES click_events(id),
  platform TEXT NOT NULL,
  order_id TEXT,
  commission_amount DECIMAL(10,2) NOT NULL,
  sale_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE automation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  niche_id UUID REFERENCES niches(id),
  platform TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  schedule_type TEXT CHECK (schedule_type IN ('hourly', 'daily', 'weekly', 'custom')),
  schedule_cron TEXT,
  actions JSONB DEFAULT '[]',
  filters JSONB DEFAULT '{}',
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  products_added INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  product_id UUID REFERENCES affiliate_products(id),
  content_type TEXT CHECK (content_type IN ('description', 'review', 'seo_title', 'seo_description', 'social_post', 'email', 'image_prompt')),
  prompt_used TEXT,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model TEXT,
  approved BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  status TEXT CHECK (status IN ('success', 'error', 'running')),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  type TEXT CHECK (type IN ('commission', 'product_added', 'price_change', 'campaign_complete', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_setup_progress (
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

CREATE TABLE automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_key TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL CHECK (automation_id IN ('auto_discover', 'auto_prices', 'auto_content', 'auto_seo', 'auto_new_releases', 'auto_commissions', 'auto_master_agent')),
  enabled BOOLEAN DEFAULT true,
  schedule_cron TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setup_key, automation_id)
);

CREATE INDEX idx_platform_accounts_user ON platform_accounts(user_id);
CREATE INDEX idx_platform_setup_progress_key ON platform_setup_progress(setup_key);
CREATE INDEX idx_automation_settings_key ON automation_settings(setup_key);
CREATE INDEX idx_affiliate_products_user ON affiliate_products(user_id);
CREATE INDEX idx_affiliate_products_platform ON affiliate_products(platform);
CREATE INDEX idx_affiliate_products_slug ON affiliate_products(slug);
CREATE INDEX idx_click_events_product ON click_events(product_id);
CREATE INDEX idx_click_events_user ON click_events(user_id);
CREATE INDEX idx_commissions_user ON commissions(user_id);
CREATE INDEX idx_commissions_status ON commissions(status);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_setup_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_profiles ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY users_own_platform_accounts ON platform_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_niches ON niches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_products ON affiliate_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_clicks ON click_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_commissions ON commissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_campaigns ON automation_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_content ON ai_generated_content FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_logs ON agent_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_notifications ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY users_own_platform_setup ON platform_setup_progress FOR ALL USING (auth.uid() = user_id OR setup_key = 'default');
CREATE POLICY users_own_automation_settings ON automation_settings FOR ALL USING (auth.uid() = user_id OR setup_key = 'default');
