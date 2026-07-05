UPDATE catalog_items
SET status = 'archived', updated_at = now()
WHERE item_type = 'service_template'
  AND slug NOT IN (
    'logo-ia','flyer-ia','pack-instagram','portada-musical',
    'guion-anuncio','video-promocional','web-basica','ebook',
    'campana-meta-ads','musica-jingle','menu-restaurante','kit-marca'
  );
