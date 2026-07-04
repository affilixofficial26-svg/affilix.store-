ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS image_provider TEXT CHECK (image_provider IN ('openai', 'custom')),
  ADD COLUMN IF NOT EXISTS image_model TEXT DEFAULT 'gpt-image-1.5',
  ADD COLUMN IF NOT EXISTS image_api_key TEXT,
  ADD COLUMN IF NOT EXISTS image_base_url TEXT;

ALTER TABLE affiliate_products
  ADD COLUMN IF NOT EXISTS image_source TEXT CHECK (image_source IN ('supplier', 'ai', 'manual')),
  ADD COLUMN IF NOT EXISTS image_prompt TEXT,
  ADD COLUMN IF NOT EXISTS image_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_affiliate_products_missing_images
  ON affiliate_products(user_id, is_active)
  WHERE image_url IS NULL;

ALTER TABLE ai_generated_content
  DROP CONSTRAINT IF EXISTS ai_generated_content_content_type_check;

ALTER TABLE ai_generated_content
  ADD CONSTRAINT ai_generated_content_content_type_check
  CHECK (content_type IN ('description', 'review', 'seo_title', 'seo_description', 'social_post', 'email', 'image_prompt'));
