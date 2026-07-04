INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('digital-products', 'digital-products', false, 524288000, NULL),
  ('media-generated', 'media-generated', false, 524288000, NULL),
  ('catalog-media', 'catalog-media', true, 52428800, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS public_read_catalog_media ON storage.objects;
CREATE POLICY public_read_catalog_media ON storage.objects
  FOR SELECT USING (bucket_id = 'catalog-media');

DROP POLICY IF EXISTS service_role_full_storage ON storage.objects;
CREATE POLICY service_role_full_storage ON storage.objects
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
