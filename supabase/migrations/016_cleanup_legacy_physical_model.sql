-- AFFILIX Digital Hub cleanup.
-- Retires physical-provider data from active surfaces without dropping legacy tables.

DO $$
BEGIN
  IF to_regclass('public.affiliate_products') IS NOT NULL THEN
    UPDATE affiliate_products
    SET is_active = false,
        updated_at = now()
    WHERE lower(platform) IN ('amazon', 'aliexpress', 'shein', 'temu', 'ebay', 'walmart', 'spocket', 'cjdrop')
       OR lower(coalesce(category, '')) IN ('fisicos', 'físicos', 'dropshipping', 'proveedores');
  END IF;

  IF to_regclass('public.platform_accounts') IS NOT NULL THEN
    UPDATE platform_accounts
    SET connected = false,
        last_test_status = 'error',
        last_test_message = 'Retirado del foco principal por migracion AFFILIX Digital Hub.',
        updated_at = now()
    WHERE lower(platform) IN ('amazon', 'aliexpress', 'shein', 'temu', 'ebay', 'walmart', 'spocket', 'cjdrop');
  END IF;

  IF to_regclass('public.agent_logs') IS NOT NULL THEN
    INSERT INTO agent_logs (user_id, action, details, status)
    VALUES (
      null,
      'digital_hub_legacy_cleanup',
      '{"removed_focus":["amazon","aliexpress","shein","temu","ebay","walmart","physical_providers","dropshipping"],"kept_compatibility":true}'::jsonb,
      'success'
    );
  END IF;
END $$;
