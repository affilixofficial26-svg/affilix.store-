CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  tag TEXT NOT NULL DEFAULT 'general',
  source TEXT,
  consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug, version)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comparison_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  compared_tools TEXT[] NOT NULL DEFAULT '{}',
  criteria JSONB NOT NULL DEFAULT '[]',
  verdict_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_legal_documents ON legal_documents;
CREATE POLICY public_read_legal_documents ON legal_documents FOR SELECT USING (published = true);

DROP POLICY IF EXISTS public_read_comparison_pages ON comparison_pages;
CREATE POLICY public_read_comparison_pages ON comparison_pages FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS service_role_site_settings ON site_settings;
CREATE POLICY service_role_site_settings ON site_settings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_email_subscribers ON email_subscribers;
CREATE POLICY service_role_email_subscribers ON email_subscribers FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_legal_documents ON legal_documents;
CREATE POLICY service_role_legal_documents ON legal_documents FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_support_tickets ON support_tickets;
CREATE POLICY service_role_support_tickets ON support_tickets FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_comparison_pages ON comparison_pages;
CREATE POLICY service_role_comparison_pages ON comparison_pages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO site_settings (key, value) VALUES
  ('brand', '{"name":"AFFILIX","tagline":"Crea. Vende. Automatiza.","email_from":"hola@affilix.es","support_email":"soporte@affilix.es"}'),
  ('affiliate', '{"attribution_days":30,"default_commission_pct":30,"hold_days":14,"min_payout_cents":5000}'),
  ('tax', '{"default_rate":21,"country":"ES","currency":"EUR"}'),
  ('saas_categories', '["video","imagen","voz","musica","webs","marketing","automatizacion","hosting","seo","email","diseno","productividad"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO catalog_items (item_type,title,slug,short_description,description,status,price,currency,category,tags,delivery_type,featured,commercial_use,metadata)
VALUES
  ('digital_product','100 Prompts de Marketing con IA','pack-prompts-marketing-100','Prompts listos para campañas, anuncios, emails y redes.','PDF y base Notion con 100 prompts organizados por objetivo: captación, venta, contenidos, anuncios, emails y optimización.','published',12,'EUR','Prompts',ARRAY['prompts','marketing','ia'],'download',true,true,'{"license":"personal_commercial"}'),
  ('digital_product','30 Plantillas Instagram Editables','plantillas-instagram-30','Pack visual para posts, stories y promociones.','Plantillas pensadas para negocios locales, creadores y servicios digitales. Incluye estructura de publicaciones y guía de uso.','published',19,'EUR','Plantillas',ARRAY['instagram','canva','figma'],'download',true,true,'{"license":"commercial"}'),
  ('digital_product','Cómo vender productos digitales en 2026','ebook-vender-digitales','Guía práctica para crear, publicar y vender.','Ebook de lanzamiento para validar una oferta digital, crear activos, preparar checkout, automatizar entrega y promocionar sin depender de stock físico.','published',15,'EUR','Ebooks',ARRAY['ebook','ventas','digital'],'download',true,false,'{"license":"personal"}'),
  ('digital_product','20 Portadas Musicales IA','pack-portadas-musicales-20','Recursos visuales 3000x3000 para música y campañas.','Pack de portadas base para singles, EPs y piezas promocionales. Licencia comercial estándar incluida.','published',9,'EUR','Recursos',ARRAY['musica','portadas','ia'],'download',false,true,'{"license":"commercial"}'),
  ('bundle','Bundle Emprendedor','bundle-emprendedor','Cinco recursos para lanzar tu primera oferta digital.','Incluye prompts, emails, hooks, checklist de lanzamiento y plantilla de brief para servicios IA.','published',39,'EUR','Bundles',ARRAY['bundle','emprendedores'],'download',true,true,'{"license":"personal_commercial"}'),
  ('digital_product','25 Plantillas de Email en Frío','plantillas-emails-frios','Emails para captar clientes sin empezar de cero.','Plantillas para prospección, seguimiento, recuperación, propuesta y cierre.','published',12,'EUR','Plantillas',ARRAY['email','ventas'],'download',false,true,'{"license":"commercial"}'),
  ('digital_product','500 Hooks para Reels y Shorts','pack-hooks-shorts-500','Hooks organizados por nicho, emoción y objetivo.','CSV y PDF para crear contenido corto con ganchos listos para adaptar.','published',9,'EUR','Guías',ARRAY['shorts','reels','hooks'],'download',false,false,'{"license":"personal"}'),
  ('digital_product','Plantilla Notion CRM para Freelance','plantilla-notion-crm','Sistema sencillo para leads, propuestas y clientes.','Plantilla Notion para organizar contactos, oportunidades, tareas, facturación básica y seguimiento.','published',15,'EUR','Plantillas',ARRAY['notion','crm'],'download',false,false,'{"license":"personal"}'),
  ('digital_product','Guía Meta Ads 2026','guia-meta-ads-2026','Playbook completo para campañas pequeñas.','Guía de estrategia, estructura de campañas, creatividades, lectura de métricas y optimización inicial.','published',19,'EUR','Guías',ARRAY['meta ads','marketing'],'download',false,false,'{"license":"personal"}'),
  ('lead_magnet','7 Prompts para arrancar cualquier negocio digital','lead-magnet-starter','Descargable gratuito para empezar hoy.','Siete prompts prácticos para encontrar oferta, público, contenido y primer activo vendible.','published',0,'EUR','Gratis',ARRAY['lead magnet','prompts'],'download',true,false,'{"tag":"lead-magnet"}')
ON CONFLICT (slug) DO UPDATE SET short_description = EXCLUDED.short_description, description = EXCLUDED.description, status = 'published', price = EXCLUDED.price, metadata = EXCLUDED.metadata;

INSERT INTO catalog_items (item_type,title,slug,short_description,description,status,price,currency,category,tags,delivery_type,featured,commercial_use,metadata)
VALUES
  ('service_template','Crear logo','logo-ia','Logo profesional en cuatro formatos.','Cuéntanos marca, sector, estilo y colores. Generamos propuestas con MuAPI, curamos la elegida y entregamos PNG, SVG, JPG y versión monocroma.', 'published',19,'EUR','Branding',ARRAY['logo','marca','muapi'],'service',true,true,'{"state":"active","revisions":2,"time":"2h","provider":"flux-dev"}'),
  ('service_template','Crear flyer','flyer-ia','Flyer promocional listo para redes o impresión.','Diseño de flyer para evento, oferta o negocio local con formato A4, A5, story o post cuadrado.', 'published',12,'EUR','Diseño',ARRAY['flyer','marketing'],'service',true,true,'{"state":"active","revisions":1,"time":"1h","provider":"flux-dev"}'),
  ('service_template','Pack de Instagram','pack-instagram','Nueve posts y un guion de reel.','Pack visual para mantener una línea profesional en redes con copy, estructura y piezas listas.', 'published',39,'EUR','Redes',ARRAY['instagram','posts'],'service',true,true,'{"state":"active","revisions":1,"time":"6h","provider":"flux-dev"}'),
  ('service_template','Portada musical','portada-musical','Arte visual para single, EP o campaña.','Portada cuadrada pensada para plataformas musicales, promoción y redes.', 'published',15,'EUR','Música',ARRAY['musica','cover'],'service',true,true,'{"state":"active","revisions":2,"time":"1h","provider":"midjourney"}'),
  ('service_template','Imagen de producto','imagen-producto','Imagen comercial para producto digital o físico de referencia.','Creamos una imagen de producto con fondo, estilo y formato indicados por el cliente.', 'published',9,'EUR','Producto',ARRAY['imagen','producto'],'service',true,true,'{"state":"active","revisions":1,"time":"30min","provider":"flux-dev"}'),
  ('service_template','Guion de anuncio','guion-anuncio','Guion para Meta, TikTok o YouTube.','Servicio beta con lista de espera: estructura, promesa, gancho, cierre y CTA.', 'published',15,'EUR','Copy',ARRAY['guion','ads'],'service',false,true,'{"state":"waitlist","tag":"waitlist-guion-anuncio"}'),
  ('service_template','Vídeo promocional 15s','video-promocional','Video corto para campaña o lanzamiento.','Servicio beta con lista de espera para video generativo con prompt, imagen de partida y edición.', 'published',49,'EUR','Video',ARRAY['video','muapi'],'service',false,true,'{"state":"waitlist","tag":"waitlist-video-promocional"}'),
  ('service_template','Web básica de 1 página','web-basica','Landing simple enfocada en conversión.','Servicio beta para negocios que necesitan una página clara con propuesta, CTA y formulario.', 'published',149,'EUR','Web',ARRAY['landing','web'],'service',false,true,'{"state":"waitlist","tag":"waitlist-web-basica"}'),
  ('service_template','Crear ebook','ebook','Ebook estructurado con portada y contenido.','Servicio beta para transformar un tema o brief en un ebook útil y presentable.', 'published',79,'EUR','Contenido',ARRAY['ebook','contenido'],'service',false,true,'{"state":"waitlist","tag":"waitlist-ebook"}'),
  ('service_template','Campaña Meta Ads','campana-meta-ads','Concepto, copy y creatividades.','Servicio beta para preparar una campaña inicial con ángulo, público y piezas visuales.', 'published',89,'EUR','Ads',ARRAY['meta','ads'],'service',false,true,'{"state":"waitlist","tag":"waitlist-campana-meta-ads"}'),
  ('service_template','Música o jingle 30s','musica-jingle','Pieza musical corta para marca.','Servicio beta con generación musical y entrega para uso comercial según licencia.', 'published',29,'EUR','Audio',ARRAY['jingle','suno'],'service',false,true,'{"state":"waitlist","tag":"waitlist-musica-jingle"}'),
  ('service_template','Menú de restaurante','menu-restaurante','Menú visual profesional.','Servicio beta para restaurantes que necesitan menú imprimible y versión digital.', 'published',59,'EUR','Restaurantes',ARRAY['menu','restaurante'],'service',false,true,'{"state":"waitlist","tag":"waitlist-menu-restaurante"}'),
  ('service_template','Kit de marca completo','kit-marca','Sistema visual de marca completo.','Servicio beta para crear una identidad completa con materiales base.', 'published',199,'EUR','Branding',ARRAY['kit','marca'],'service',false,true,'{"state":"waitlist","tag":"waitlist-kit-marca"}')
ON CONFLICT (slug) DO UPDATE SET short_description = EXCLUDED.short_description, description = EXCLUDED.description, status = 'published', price = EXCLUDED.price, metadata = EXCLUDED.metadata;

INSERT INTO catalog_items (item_type,title,slug,short_description,description,status,price,currency,category,tags,delivery_type,featured,commercial_use,metadata)
VALUES
  ('business_kit','Kit Restaurantes','restaurantes','Logo, menú, posts, stories, flyer y guiones.','Kit de 72h para restaurantes: identidad, menú A4/A5, 12 posts, 4 stories, flyer y textos.', 'published',149,'EUR','Restaurantes',ARRAY['restaurantes','kit'],'service',true,true,'{"time":"72h"}'),
  ('business_kit','Kit Barberías','barberias','Marca, promociones, reels y fidelización.','Logo, posts, stories, reels, tarjeta de fidelización, flyer local y textos.', 'published',129,'EUR','Barberías',ARRAY['barberias','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Tiendas','tiendas','Catálogo, campañas y recursos de venta.','Logo, 15 posts, stories, videos de producto, banners y descripciones.', 'published',179,'EUR','Tiendas',ARRAY['tiendas','kit'],'service',false,true,'{"time":"4d"}'),
  ('business_kit','Kit Inmobiliarias','inmobiliarias','Fichas, anuncios y piezas comerciales.','Logo, fichas visuales, posts, videos, flyer, SEO de propiedades y email a leads.', 'published',199,'EUR','Inmobiliarias',ARRAY['inmobiliarias','kit'],'service',false,true,'{"time":"4d"}'),
  ('business_kit','Kit Músicos','musicos','Portada, press kit y promoción digital.','Portada, posts, stories, press kit, banner y jingle promocional.', 'published',149,'EUR','Música',ARRAY['musicos','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Eventos','eventos','Cartel, entradas, posts y campaña.','Cartel principal, entradas con QR, posts, stories, guion de reel y banner ads.', 'published',169,'EUR','Eventos',ARRAY['eventos','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Electricistas','electricistas','Identidad, web y captación local.','Logo, web básica, posts, flyer QR, firma de email y textos SEO local.', 'published',129,'EUR','Electricistas',ARRAY['electricistas','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Gimnasios','gimnasios','Campañas, planes y contenido social.','Logo, 12 posts, reels, landing prueba gratis, plan mensual y emails.', 'published',179,'EUR','Gimnasios',ARRAY['gimnasios','kit'],'service',false,true,'{"time":"4d"}'),
  ('business_kit','Kit Estética','estetica','Marca, promociones y agenda visual.','Logo, posts, agenda visual, flyer QR, stories y textos para reservas.', 'published',159,'EUR','Estética',ARRAY['estetica','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Creadores','creadores','Sistema de contenido y monetización.','Logo personal, plantillas, hooks, portada podcast, bio y guion de monetización.', 'published',129,'EUR','Creadores',ARRAY['creadores','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit YouTubers','youtubers','Miniaturas, guiones y kit de canal.','Thumbnails, intro/outro, banner, avatar, guion, títulos SEO y descripción.', 'published',149,'EUR','YouTube',ARRAY['youtube','kit'],'service',false,true,'{"time":"72h"}'),
  ('business_kit','Kit Agencias','agencias','Identidad, deck y sistema comercial.','Identidad, deck, propuesta, posts, landing, reel y automatización básica.', 'published',249,'EUR','Agencias',ARRAY['agencias','kit'],'service',false,true,'{"time":"5d"}')
ON CONFLICT (slug) DO UPDATE SET short_description = EXCLUDED.short_description, description = EXCLUDED.description, status = 'published', price = EXCLUDED.price, metadata = EXCLUDED.metadata;

INSERT INTO catalog_items (item_type,title,slug,short_description,description,status,price,currency,category,tags,delivery_type,external_url,affiliate_disclosure,featured,commercial_use,metadata)
VALUES
  ('saas_offer','Runway','runway','IA para video cinematográfico corto.','Herramienta avanzada para generar y editar video con IA.', 'published',NULL,'EUR','IA para vídeo',ARRAY['video','ia'],'external','https://runwayml.com',true,true,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Kling','kling','Image-to-video con estilo cinematográfico.','Opción fuerte para convertir imágenes en videos cortos con movimiento coherente.', 'published',NULL,'EUR','IA para vídeo',ARRAY['video','ia'],'external','https://klingai.com',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Midjourney','midjourney','Dirección artística para imagen IA.','Referencia popular para imágenes con alto impacto visual.', 'published',NULL,'EUR','IA para imagen',ARRAY['imagen','ia'],'external','https://www.midjourney.com',true,true,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Ideogram','ideogram','Imagen IA con mejor manejo de texto.','Útil para piezas donde el texto dentro de imagen importa.', 'published',NULL,'EUR','IA para imagen',ARRAY['imagen','texto'],'external','https://ideogram.ai',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','ElevenLabs','elevenlabs','Voces IA premium.','Generación de voz natural, clonación y doblaje para creadores.', 'published',NULL,'EUR','IA para voz',ARRAY['voz','tts'],'external','https://elevenlabs.io',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Suno','suno','Música generativa rápida.','Canciones, jingles y demos musicales desde prompts.', 'published',NULL,'EUR','IA para música',ARRAY['musica','audio'],'external','https://suno.com',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Framer','framer','Landings visuales con animaciones.','Constructor web moderno para lanzar páginas rápido.', 'published',NULL,'EUR','IA para webs',ARRAY['web','landing'],'external','https://framer.com',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','n8n','n8n','Automatización potente y flexible.','Automatiza flujos de negocio con integraciones y lógica avanzada.', 'published',NULL,'EUR','Automatización',ARRAY['automatizacion'],'external','https://n8n.io',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Vercel','vercel','Hosting ideal para Next.js.','Deploy rápido, edge, previews y producción para apps modernas.', 'published',NULL,'EUR','Hosting',ARRAY['hosting','nextjs'],'external','https://vercel.com',true,false,true,'{"verified_at":"2026-07-05"}'),
  ('saas_offer','Resend','resend','Email transaccional para developers.','API de email para entregas, notificaciones y flujos transaccionales.', 'published',NULL,'EUR','Email marketing',ARRAY['email'],'external','https://resend.com',true,false,true,'{"verified_at":"2026-07-05"}')
ON CONFLICT (slug) DO UPDATE SET short_description = EXCLUDED.short_description, description = EXCLUDED.description, status = 'published', external_url = EXCLUDED.external_url, metadata = EXCLUDED.metadata;

INSERT INTO saas_offers (catalog_item_id, program_name, affiliate_url, pricing_summary, best_for, pros, cons, commission_summary, last_verified_at)
SELECT id, title, COALESCE(external_url, 'https://affilix.es'), 'Según plan del proveedor', short_description, ARRAY['Herramienta verificada','Uso profesional','Encaja en flujos AFFILIX'], ARRAY['Revisar precio antes de contratar','Puede requerir curva de aprendizaje'], 'Puede contener enlace afiliado', NOW()
FROM catalog_items WHERE item_type = 'saas_offer'
ON CONFLICT (catalog_item_id) DO UPDATE SET best_for = EXCLUDED.best_for, last_verified_at = NOW();

INSERT INTO comparison_pages (slug,title,short_description,compared_tools,criteria,verdict_md,status)
VALUES
  ('mejor-ia-crear-videos','Mejor IA para crear vídeos en 2026','Runway vs Kling vs Luma vs HeyGen vs Sora.',ARRAY['Runway','Kling','Luma','HeyGen','Sora'],'[{"name":"calidad","weight":30},{"name":"control","weight":25},{"name":"precio","weight":20}]','Para video corto con control creativo, Runway y Kling son las opciones más equilibradas. Para avatares, HeyGen.', 'published'),
  ('mejor-ia-hacer-logos','Mejor IA para hacer logos','Midjourney vs Ideogram vs Recraft vs Leonardo.',ARRAY['Midjourney','Ideogram','Recraft','Leonardo'],'[{"name":"texto","weight":30},{"name":"vector","weight":25},{"name":"coste","weight":20}]','Para identidad visual rápida, Ideogram y Recraft destacan cuando el texto importa; Midjourney gana en dirección artística.', 'published'),
  ('mejor-plataforma-vender-digitales','Mejor plataforma para vender productos digitales','AFFILIX vs Gumroad vs Lemon Squeezy vs Payhip.',ARRAY['AFFILIX','Gumroad','Lemon Squeezy','Payhip'],'[{"name":"entrega","weight":25},{"name":"afiliados","weight":25},{"name":"ia","weight":25}]','AFFILIX encaja mejor cuando quieres vender y producir con IA en un mismo sistema.', 'published'),
  ('mejor-herramienta-automatizar-redes','Mejor herramienta para automatizar redes','Metricool vs Buffer vs Later vs Simplified.',ARRAY['Metricool','Buffer','Later','Simplified'],'[]','Metricool es fuerte para planificación y medición; Buffer es simple y directo.', 'published'),
  ('mejor-software-crear-webs','Mejor software para crear webs sin código','Framer vs Webflow vs Wix Studio vs Lovable.',ARRAY['Framer','Webflow','Wix Studio','Lovable'],'[]','Framer es rápido para landings; Webflow da más control; Lovable acelera prototipos.', 'published'),
  ('mejor-stack-creadores','Mejor stack para creadores en 2026','Notion + beehiiv + Canva + ElevenLabs + Descript.',ARRAY['Notion','beehiiv','Canva','ElevenLabs','Descript'],'[]','El mejor stack es el que reduce fricción: documentación, email, diseño, voz y edición.', 'published'),
  ('mejor-stack-negocios-locales','Mejor stack para negocios locales','Wix + Metricool + Canva + MailerLite y alternativas.',ARRAY['Wix','Metricool','Canva','MailerLite'],'[]','Para negocio local, prioriza facilidad, bajo coste y velocidad de publicación.', 'published')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, short_description = EXCLUDED.short_description, verdict_md = EXCLUDED.verdict_md, status = 'published';

INSERT INTO legal_documents (slug,version,title,content_md,published,published_at)
VALUES
  ('terminos','1.0','Términos de uso','AFFILIX presta servicios digitales, productos descargables, herramientas de IA y recomendaciones SaaS. El uso de la plataforma implica aceptar estas condiciones. Jurisdicción: España, con referencia a Madrid salvo norma imperativa aplicable.',true,NOW()),
  ('privacidad','1.0','Política de privacidad','Tratamos datos para gestionar cuentas, compras, entregas, soporte, afiliados y comunicaciones. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a soporte@affilix.es.',true,NOW()),
  ('cookies','1.0','Política de cookies','Usamos cookies técnicas necesarias y, con consentimiento, analíticas y funcionales. Puedes cambiar tu preferencia cuando esté disponible el panel de consentimiento.',true,NOW()),
  ('reembolsos','1.0','Política de reembolsos','En productos digitales, la descarga o ejecución del servicio puede implicar renuncia al desistimiento cuando así se acepte en checkout. Si una entrega falla por causa de AFFILIX, soporte reenvía, reintenta o revisa reembolso.',true,NOW()),
  ('licencias','1.0','Licencias digitales','Las licencias pueden ser personales, comerciales estándar o extendidas. Cada ficha indica el alcance antes de comprar y la licencia viaja con la entrega.',true,NOW()),
  ('afiliados','1.0','Condiciones del programa de afiliados','El afiliado debe promocionar de forma transparente, sin spam, sin autocompras y sin anuncios sobre la marca AFFILIX. Las comisiones se liberan tras el periodo de retención definido.',true,NOW())
ON CONFLICT (slug, version) DO UPDATE SET title = EXCLUDED.title, content_md = EXCLUDED.content_md, published = true, published_at = NOW();
