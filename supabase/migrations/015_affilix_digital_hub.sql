CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('digital_product', 'saas_offer', 'service_template', 'business_kit', 'bundle', 'lead_magnet', 'subscription_plan')),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  image_url TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'es',
  commercial_use BOOLEAN NOT NULL DEFAULT false,
  delivery_type TEXT NOT NULL DEFAULT 'external' CHECK (delivery_type IN ('download', 'service', 'external', 'access')),
  external_url TEXT,
  affiliate_disclosure BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS digital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  download_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID UNIQUE NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  input_schema JSONB NOT NULL DEFAULT '{}',
  workflow JSONB NOT NULL DEFAULT '[]',
  estimated_minutes INTEGER,
  revision_limit INTEGER NOT NULL DEFAULT 0,
  requires_review BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID UNIQUE NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  pricing_summary TEXT,
  best_for TEXT,
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  commission_summary TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vertical_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID UNIQUE NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES business_verticals(id) ON DELETE RESTRICT,
  included_items JSONB NOT NULL DEFAULT '[]',
  personalization_schema JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'ready', 'delivered', 'cancelled', 'refunded', 'failed')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_provider TEXT,
  payment_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  input_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID UNIQUE NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'review', 'completed', 'failed', 'cancelled')),
  current_step TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  result JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  digital_asset_id UUID REFERENCES digital_assets(id) ON DELETE SET NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_downloads INTEGER NOT NULL DEFAULT 3,
  download_count INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  source TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_type_status ON catalog_items(item_type, status);
CREATE INDEX IF NOT EXISTS idx_catalog_items_featured ON catalog_items(featured) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_email ON customer_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_service_runs_status ON service_runs(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_published_catalog ON catalog_items;
CREATE POLICY public_read_published_catalog ON catalog_items
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS public_read_active_verticals ON business_verticals;
CREATE POLICY public_read_active_verticals ON business_verticals
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS public_read_published_saas ON saas_offers;
CREATE POLICY public_read_published_saas ON saas_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_items
      WHERE catalog_items.id = saas_offers.catalog_item_id
        AND catalog_items.status = 'published'
    )
  );
