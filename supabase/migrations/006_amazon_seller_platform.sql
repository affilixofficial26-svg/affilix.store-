DO $$
DECLARE
  platform_values TEXT := '''amazon'', ''amazon_seller'', ''ebay'', ''rakuten'', ''clickbank'', ''digistore'', ''jvzoo'', ''cj'', ''shareasale'', ''impact'', ''awin'', ''spocket'', ''cjdrop'', ''shopify'', ''etsy''';
BEGIN
  ALTER TABLE platform_accounts DROP CONSTRAINT IF EXISTS platform_accounts_platform_check;
  EXECUTE 'ALTER TABLE platform_accounts ADD CONSTRAINT platform_accounts_platform_check CHECK (platform IN (' || platform_values || '))';

  ALTER TABLE affiliate_products DROP CONSTRAINT IF EXISTS affiliate_products_platform_check;
  EXECUTE 'ALTER TABLE affiliate_products ADD CONSTRAINT affiliate_products_platform_check CHECK (platform IN (' || platform_values || '))';

  ALTER TABLE platform_setup_progress DROP CONSTRAINT IF EXISTS platform_setup_progress_platform_check;
  EXECUTE 'ALTER TABLE platform_setup_progress ADD CONSTRAINT platform_setup_progress_platform_check CHECK (platform IN (' || platform_values || '))';
END $$;
