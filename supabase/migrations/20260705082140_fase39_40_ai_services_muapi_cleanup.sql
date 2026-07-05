ALTER TABLE muapi_jobs DROP CONSTRAINT IF EXISTS muapi_jobs_category_check;
ALTER TABLE muapi_jobs ADD CONSTRAINT muapi_jobs_category_check
  CHECK (category IN ('text','image','video','audio','enhance','edit','avatar','3d','upload'));

ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS internal_prompt text;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS workflow_steps jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS estimated_delivery_hours integer;
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS requires_human_approval boolean NOT NULL DEFAULT true;

INSERT INTO catalog_items (item_type, slug, title, short_description, description, category, tags, status, price, currency, delivery_type, commercial_use, featured, metadata)
VALUES
  ('service_template','logo-ia','Crear logo','Logo profesional en PNG, SVG y monocromo.','Servicio de creacion de logo con propuestas visuales, revision humana y licencia comercial estandar.','imagen', ARRAY['logo','branding','muapi'], 'published', 19, 'EUR', 'service', true, true, '{"turnaround_hours":2,"revisions":2,"provider":"muapi"}'),
  ('service_template','flyer-ia','Crear flyer','Flyer promocional profesional para digital o impresion.','Diseño promocional adaptado a tu marca, campana y canal principal.','imagen', ARRAY['flyer','diseno','muapi'], 'published', 29, 'EUR', 'service', true, true, '{"turnaround_hours":4,"revisions":2,"provider":"muapi"}'),
  ('service_template','pack-instagram','Pack de Instagram','Piezas visuales y textos para publicar.','Pack de posts y stories con linea visual consistente para una campana concreta.','imagen', ARRAY['instagram','social','muapi'], 'published', 49, 'EUR', 'service', true, true, '{"turnaround_hours":24,"revisions":1,"provider":"muapi"}'),
  ('service_template','portada-musical','Portada musical','Cover art cinematografico para single, album o playlist.','Portada musical lista para plataformas digitales con direccion visual premium.','imagen', ARRAY['musica','cover','muapi'], 'published', 39, 'EUR', 'service', true, true, '{"turnaround_hours":24,"revisions":1,"provider":"muapi"}'),
  ('service_template','guion-anuncio','Guion de anuncio','Guion persuasivo para Meta, TikTok o YouTube.','Guion persuasivo con gancho, problema, solucion, prueba, oferta y llamada a la accion. Se entrega con timestamps, indicaciones visuales y hooks alternativos.','texto', ARRAY['guion','ads','copywriting'], 'published', 15, 'EUR', 'service', true, false, '{"turnaround_hours":4,"revisions":2,"provider":"muapi","muapi_model":"claude-sonnet-4-6"}'),
  ('service_template','video-promocional','Video promocional 15s','Video vertical listo para Reels, Shorts y TikTok.','Video promocional vertical de 15 segundos a partir de imagen o brief textual, con movimiento cinematografico y licencia comercial estandar.','video', ARRAY['video','reel','shorts'], 'published', 49, 'EUR', 'service', true, false, '{"turnaround_hours":24,"revisions":1,"provider":"muapi","muapi_model":"kling-pro-video"}'),
  ('service_template','web-basica','Web basica de 1 pagina','Landing profesional enfocada en conversion.','Pagina web estatica de una pantalla con hero, beneficios, CTA, contacto, SEO basico y ZIP listo para publicar.','web', ARRAY['web','landing','conversion'], 'published', 149, 'EUR', 'service', true, false, '{"turnaround_hours":48,"revisions":1,"provider":"mixed"}'),
  ('service_template','ebook','Crear ebook','Ebook con contenido, portada y maquetacion PDF.','Ebook completo con contenido estructurado, portada profesional y PDF listo para vender o regalar.','texto', ARRAY['ebook','pdf','contenido'], 'published', 79, 'EUR', 'service', true, false, '{"turnaround_hours":48,"revisions":1,"provider":"mixed"}'),
  ('service_template','campana-meta-ads','Campana Meta Ads','Concepto, copies y creatividades listas.','Campana Meta Ads con concepto, publico, presupuesto sugerido, copies, creatividades y guia de subida.','marketing', ARRAY['ads','meta','facebook','instagram'], 'published', 89, 'EUR', 'service', true, false, '{"turnaround_hours":24,"revisions":1,"provider":"mixed"}'),
  ('service_template','musica-jingle','Musica o jingle 30s','Pieza musical original con Suno.','Pieza musical original de hasta 30 segundos para marca, reel, anuncio o podcast.','audio', ARRAY['musica','jingle','audio'], 'published', 29, 'EUR', 'service', true, false, '{"turnaround_hours":3,"revisions":1,"provider":"muapi","muapi_model":"suno-music"}'),
  ('service_template','menu-restaurante','Menu de restaurante','Menu visual profesional en PDF.','Menu visual para restaurante, cafeteria o bar, con PDF listo para imprimir y piezas sociales opcionales.','kit', ARRAY['menu','restaurante','pdf'], 'published', 59, 'EUR', 'service', true, false, '{"turnaround_hours":24,"revisions":2,"provider":"mixed"}'),
  ('service_template','kit-marca','Kit de marca','Sistema visual completo para tu marca.','Sistema visual completo: logo, isotipo, paleta, tipografia, mockups y guia de marca PDF.','branding', ARRAY['branding','logo','kit'], 'published', 199, 'EUR', 'service', true, false, '{"turnaround_hours":120,"revisions":2,"provider":"mixed"}')
ON CONFLICT (slug) DO UPDATE SET
  item_type = EXCLUDED.item_type,
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  status = 'published',
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  delivery_type = 'service',
  commercial_use = true,
  metadata = catalog_items.metadata || EXCLUDED.metadata,
  updated_at = now();

WITH templates AS (
  SELECT * FROM (VALUES
    ('logo-ia','flux-dev-image','flux-dev','image',2,2,'Brief de logo: {{brand_name}}, {{sector}}, {{style}}, {{colors}}. Genera identidad visual profesional y archivos comerciales.'),
    ('flyer-ia','flux-dev-image','flux-dev','image',4,2,'Flyer promocional para {{business_name}}. Objetivo: {{campaign_goal}}. Estilo: {{style}}.'),
    ('pack-instagram','flux-dev-image','flux-dev','image',24,1,'Pack Instagram para {{brand_name}} con posts, stories y copies coherentes.'),
    ('portada-musical','midjourney-image','midjourney','image',24,1,'Cover art para {{artist_project}}. Genero: {{genre}}. Mood: {{mood}}.'),
    ('guion-anuncio','text-generation','claude-sonnet-4-6','text',4,2,'Write a timestamped ad script for {{platform}} and {{duration}}. Product: {{product_name}}. Audience: {{target_audience}}. Promise: {{promise}}. Return Markdown with script, 3 hooks and shooting notes.'),
    ('video-promocional','kling-pro-video','kling-pro','video',24,1,'Generate a {{duration}} promotional video. Scene: {{brief}}. Style: {{style}}. No text in video.'),
    ('web-basica','text-generation','claude-sonnet-4-6','text',48,1,'Write one-page landing copy JSON for {{business_name}}. Value proposition: {{value_proposition}}. Sections: {{sections}}. No lorem ipsum.'),
    ('ebook','text-generation','claude-sonnet-4-6','text',48,1,'Create ebook outline and chapter content for {{title}}. Audience: {{audience}}. Brief: {{brief}}. Language: {{language}}.'),
    ('campana-meta-ads','text-generation','claude-sonnet-4-6','text',24,1,'Create Meta Ads campaign JSON for {{product}}. Objective: {{objective}}. Audience: {{audience}}. Market: {{market}}. Include copies and creative prompts.'),
    ('musica-jingle','suno-music','suno-v3.5','audio',3,1,'Create a {{duration}} music track. Genre: {{genre}}. Mood: {{mood}}. Use case: {{use_case}}.'),
    ('menu-restaurante','text-generation','claude-sonnet-4-6','text',24,2,'Normalize restaurant menu sections for {{restaurant_name}} and produce print-ready structure. Cuisine: {{cuisine_type}}.'),
    ('kit-marca','flux-dev-image','flux-dev','image',120,2,'Create brand system for {{brand_name}}. Sector: {{sector}}. Values: {{values}}. Audience: {{audience}}. Style: {{style}}.')
  ) AS t(slug, endpoint, model, category, hours, revisions, prompt)
)
INSERT INTO service_templates (
  catalog_item_id, input_schema, workflow, workflow_steps, internal_prompt,
  execution_provider, muapi_endpoint, muapi_model, input_mapping,
  estimated_credits, estimated_minutes, estimated_delivery_hours,
  revision_limit, included_revisions, requires_review, requires_human_approval
)
SELECT
  ci.id,
  jsonb_build_object(
    'brief', jsonb_build_object('type','textarea','required',true,'label','Brief del servicio'),
    'style', jsonb_build_object('type','text','required',false,'label','Estilo deseado'),
    'reference_url', jsonb_build_object('type','url','required',false,'label','Referencia opcional'),
    'email', jsonb_build_object('type','email','required',true,'label','Email de entrega')
  ),
  jsonb_build_array(
    jsonb_build_object('id','brief','type','validate_input'),
    jsonb_build_object('id','generate','type','muapi','endpoint',t.endpoint,'model',t.model,'category',t.category),
    jsonb_build_object('id','review','type','human_approval'),
    jsonb_build_object('id','deliver','type','delivery_email')
  ),
  jsonb_build_array(
    jsonb_build_object('id','brief','type','validate_input'),
    jsonb_build_object('id','generate','type','muapi','endpoint',t.endpoint,'model',t.model,'category',t.category),
    jsonb_build_object('id','review','type','human_approval'),
    jsonb_build_object('id','deliver','type','delivery_email')
  ),
  t.prompt,
  CASE WHEN t.slug IN ('web-basica','ebook','campana-meta-ads','menu-restaurante','kit-marca') THEN 'mixed' ELSE 'muapi' END,
  t.endpoint,
  t.model,
  '{"mode":"direct"}'::jsonb,
  CASE WHEN t.category = 'video' THEN 120 ELSE 15 END,
  t.hours * 60,
  t.hours,
  t.revisions,
  t.revisions,
  true,
  true
FROM templates t
JOIN catalog_items ci ON ci.slug = t.slug
ON CONFLICT (catalog_item_id) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  workflow = EXCLUDED.workflow,
  workflow_steps = EXCLUDED.workflow_steps,
  internal_prompt = EXCLUDED.internal_prompt,
  execution_provider = EXCLUDED.execution_provider,
  muapi_endpoint = EXCLUDED.muapi_endpoint,
  muapi_model = EXCLUDED.muapi_model,
  input_mapping = EXCLUDED.input_mapping,
  estimated_credits = EXCLUDED.estimated_credits,
  estimated_minutes = EXCLUDED.estimated_minutes,
  estimated_delivery_hours = EXCLUDED.estimated_delivery_hours,
  revision_limit = EXCLUDED.revision_limit,
  included_revisions = EXCLUDED.included_revisions,
  requires_review = EXCLUDED.requires_review,
  requires_human_approval = EXCLUDED.requires_human_approval,
  updated_at = now();

INSERT INTO muapi_models (slug, category, display_name, description, estimated_cost_usd, active, synced_at)
VALUES
  ('claude-sonnet-4-6','text','Claude Sonnet 4.6','Modelo de texto servido via MuAPI',0.0200,true,now()),
  ('gpt-4o-muapi','text','GPT-4o via MuAPI','Modelo de texto servido via MuAPI',0.0180,true,now()),
  ('deepseek-chat','text','DeepSeek Chat','Modelo de texto servido via MuAPI',0.0060,true,now()),
  ('llama-3.1-70b','text','Llama 3.1 70B','Modelo de texto servido via MuAPI',0.0040,true,now()),
  ('gemini-1.5-pro','text','Gemini 1.5 Pro','Modelo de texto servido via MuAPI',0.0120,true,now())
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  estimated_cost_usd = EXCLUDED.estimated_cost_usd,
  active = true,
  synced_at = now();

INSERT INTO site_settings (key, value)
VALUES ('muapi_defaults', '{"text_model":"claude-sonnet-4-6","image_model":"flux-dev","video_model":"kling-pro","audio_model":"suno-music"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
