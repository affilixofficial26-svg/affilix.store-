import Link from "next/link";
import {
  AppWindow, ArrowRight, BadgeEuro, BarChart3, Bot, BriefcaseBusiness,
  Check, ChevronDown, CloudDownload, Code2, DownloadCloud,
  Dumbbell, FileArchive, Film, GitCompareArrows, Globe2, HeartPulse,
  Home, ImageIcon, Megaphone, Music2, Palette, Rocket, Search,
  ShoppingBag, Sparkles, Store, Users, WandSparkles, Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicShell } from "@/components/digital-hub/PublicShell";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

const aiServices = [
  ["Crear logo", "Identidad visual y archivos listos para usar.", Palette],
  ["Crear flyer", "Diseño promocional adaptado a tu negocio.", ImageIcon],
  ["Pack de Instagram", "Piezas visuales y textos para publicar.", Megaphone],
  ["Guion de anuncio", "Guion persuasivo adaptado a tu objetivo.", Film],
  ["Vídeo promocional", "Pieza audiovisual lista para promocionar.", Film],
  ["Web básica", "Página profesional enfocada en conversión.", Code2],
  ["Crear ebook", "Contenido estructurado, diseño y portada.", FileArchive],
  ["Campaña Meta Ads", "Concepto, copies y creatividades publicitarias.", Megaphone],
  ["Música o jingle", "Pieza musical original para tu marca.", Music2],
  ["Portada musical", "Arte visual preparado para plataformas.", ImageIcon],
  ["Menú de restaurante", "Menú visual organizado y profesional.", Store],
  ["Kit de marca", "Sistema visual coherente para tu negocio.", Sparkles],
] as const;

const businessKits = [
  ["Restaurantes", "Menú, flyers, posts, anuncios y textos.", Store],
  ["Barberías", "Marca, promociones y contenido para redes.", Users],
  ["Tiendas", "Catálogo, campañas y recursos de venta.", ShoppingBag],
  ["Inmobiliarias", "Fichas, anuncios y piezas comerciales.", Home],
  ["Músicos", "Portadas, press kit y promoción digital.", Music2],
  ["Eventos", "Cartelería, entradas y campaña de difusión.", Megaphone],
  ["Electricistas", "Identidad, web y captación local.", Sparkles],
  ["Gimnasios", "Campañas, planes y contenido social.", Dumbbell],
  ["Estética", "Marca, promociones y agenda visual.", HeartPulse],
  ["Creadores", "Sistema de contenido y monetización.", Film],
  ["YouTubers", "Miniaturas, guiones y kits de canal.", Film],
  ["Agencias", "Recursos comerciales y automatización.", BriefcaseBusiness],
] as const;

const toolCategories = ["IA para vídeo", "IA para imagen", "IA para voz", "IA para música", "IA para webs", "IA para marketing", "Automatización", "Hosting", "SEO", "Email marketing", "Diseño", "Productividad"];
const comparisons = ["Mejor IA para crear vídeos", "Mejor IA para hacer logos", "Mejor plataforma para vender productos digitales", "Mejor herramienta para automatizar redes", "Mejor software para crear webs", "Mejor stack para creadores", "Mejor stack para negocios locales"];
const heroFlow: Array<[LucideIcon, string]> = [[Sparkles,"Idea"],[Bot,"IA"],[FileArchive,"Producto"],[BadgeEuro,"Pago"],[CloudDownload,"Entrega"]];

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="mx-auto mb-10 max-w-3xl text-center">
    <p className="hub-eyebrow">{eyebrow}</p>
    <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
    <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">{copy}</p>
  </div>;
}

export default async function HomePage() {
  const catalog = await getDigitalHubCatalog(24);

  return (
    <PublicShell>
      <section className="hub-hero">
        <div className="hub-grid-bg" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-4 py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-6">
          <div className="fade-up">
            <div className="hub-pill"><Sparkles size={15} /> Plataforma digital impulsada por IA</div>
            <h1 className="mt-7 max-w-4xl font-display text-5xl font-black leading-[1.02] tracking-[-.04em] text-white sm:text-6xl lg:text-7xl">
              Crea, vende y automatiza <span className="gradient-text">productos digitales con IA.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">AFFILIX reúne productos digitales, servicios IA, kits de negocio y herramientas SaaS recomendadas para ayudarte a lanzar, vender y promocionar más rápido.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="btn btn-primary hub-btn" href="/servicios-ia"><WandSparkles size={18} /> Crear con IA</Link>
              <Link className="btn hub-btn" href="/productos-digitales">Explorar productos</Link>
              <Link className="btn hub-btn" href="/herramientas-ia">Ver herramientas IA</Link>
            </div>
            <p className="mt-6 text-sm font-bold text-cyan-300">De la idea al producto. Del producto al pago. Del pago a la entrega automática.</p>
          </div>
          <div className="hub-orbit" aria-label="Flujo de AFFILIX">
            <div className="hub-generator">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 font-black"><Bot size={18} className="text-cyan-300" /> Generador IA</span><span className="hub-live">ACTIVO</span></div>
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs text-slate-500">¿Qué quieres crear?</span>
                <p className="mt-2 text-sm font-bold text-white">Kit de lanzamiento para mi negocio</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400" /></div>
              <div className="mt-5 grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-slate-400">
                {heroFlow.map(([Icon,label], i) => <div key={label} className="relative"><span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300"><Icon size={16} /></span>{label}{i < 4 && <span className="absolute -right-2 top-4 text-blue-500">→</span>}</div>)}
              </div>
            </div>
            <div className="hub-float hub-float-one"><FileArchive size={20} /><div><b>Pack digital</b><span>Listo para descargar</span></div></div>
            <div className="hub-float hub-float-two"><Workflow size={20} /><div><b>Automatización</b><span>Entrega configurada</span></div></div>
            <div className="hub-float hub-float-three"><BarChart3 size={20} /><div><b>Crecimiento</b><span>Marketing conectado</span></div></div>
          </div>
        </div>
      </section>

      <section className="hub-section">
        <SectionHeading eyebrow="Empieza aquí" title="¿Qué quieres hacer hoy?" copy="Elige una ruta y AFFILIX te lleva directo al producto, servicio o herramienta que necesitas." />
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3 lg:px-6">
          {[
            ["Comprar productos digitales", "Descarga packs, plantillas, prompts, ebooks, guías, recursos para redes, kits y archivos listos para usar.", FileArchive, "Ver productos digitales", "/productos-digitales"],
            ["Crear algo con IA", "Genera logos, flyers, vídeos, guiones, webs, música, campañas, portadas, ebooks y contenido personalizado.", WandSparkles, "Crear con IA", "/servicios-ia"],
            ["Encontrar herramientas IA", "Compara software, SaaS y herramientas IA para elegir la mejor opción según tu objetivo.", GitCompareArrows, "Ver herramientas IA", "/herramientas-ia"],
          ].map(([title, copy, Icon, cta, href], i) => <article key={title as string} className={`hub-route-card ${i === 1 ? "hub-route-featured" : ""}`}>
            <span className="hub-icon"><Icon size={28} /></span><h3>{title as string}</h3><p>{copy as string}</p><Link href={href as string}>{cta as string}<ArrowRight size={16} /></Link>
          </article>)}
        </div>
      </section>

      <section className="hub-section hub-section-alt">
        <SectionHeading eyebrow="Servicios IA" title="Crea servicios profesionales con IA en minutos." copy="Elige lo que necesitas, rellena un formulario y AFFILIX prepara el resultado o deja el pedido listo para revisión y entrega." />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          {aiServices.map(([name, copy, Icon]) => {
            const real = catalog.services.find((item) => item.title.toLowerCase().includes(name.replace("Crear ", "").toLowerCase()));
            return <article className="hub-mini-card" key={name}><Icon size={22} className="text-cyan-300" /><h3>{real?.title || name}</h3><p>{real?.short_description || copy}</p>{real ? <Link href={`/s/${real.slug}`}>Empezar <ArrowRight size={14} /></Link> : <span className="hub-status">Próximamente</span>}</article>;
          })}
        </div>
        <div className="mt-9 text-center"><Link className="btn btn-primary hub-btn" href="/servicios-ia">Ver todos los servicios IA</Link></div>
      </section>

      <section className="hub-section">
        <SectionHeading eyebrow="Descargas" title="Productos digitales listos para descargar." copy="Packs, plantillas, ebooks, prompts y recursos creados para negocios, creadores y emprendedores." />
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          {catalog.products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalog.products.slice(0,6).map(item => <article className="hub-product" key={item.id}>
            <div className="hub-product-image">{item.image_url ? <img src={item.image_url} alt="" /> : <FileArchive size={42} />}</div>
            <div className="p-5"><span className="hub-status">{item.item_type.replaceAll("_", " ")}</span><h3 className="mt-3 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.short_description}</p><div className="mt-5 flex items-center justify-between">{item.price != null && <b>{Number(item.price).toLocaleString("es-ES", {style:"currency",currency:item.currency || "EUR"})}</b>}<Link href={`/p/${item.slug}`}>Ver producto <ArrowRight size={14} /></Link></div></div>
          </article>)}</div> : <div className="hub-empty"><FileArchive size={34}/><h3>Aún estamos preparando los primeros recursos digitales.</h3><p>Muy pronto podrás descargar packs, plantillas, prompts, ebooks y kits listos para usar.</p><Link className="btn btn-primary" href="/servicios-ia">Ver servicios IA</Link></div>}
        </div>
      </section>

      <section className="hub-section hub-section-alt">
        <SectionHeading eyebrow="Soluciones por sector" title="Kits completos para negocios y creadores." copy="Todo lo que un negocio necesita para promocionarse: textos, flyers, posts, anuncios, guiones, logos, campañas y recursos." />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:px-6">
          {businessKits.map(([sector, include, Icon]) => <article className="hub-mini-card" key={sector}><Icon size={22} className="text-violet-300"/><h3>{sector}</h3><p>{include}</p><Link href="/kits-negocio">Ver kit <ArrowRight size={14}/></Link></article>)}
        </div>
      </section>

      <section className="hub-section">
        <SectionHeading eyebrow="Software seleccionado" title="Herramientas IA y SaaS recomendadas." copy="Encuentra software para crear vídeos, imágenes, webs, automatizaciones, marketing, música, voz, diseño y ventas digitales." />
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-8 flex flex-wrap justify-center gap-2">{toolCategories.map(x => <span className="hub-chip" key={x}>{x}</span>)}</div>
          {catalog.tools.length ? <div className="grid gap-5 md:grid-cols-3">{catalog.tools.slice(0,6).map(tool => <article className="hub-tool" key={tool.id}><AppWindow size={26}/><h3>{tool.title}</h3><p>{tool.short_description}</p>{tool.offer?.best_for && <small>Mejor para: {tool.offer.best_for}</small>}<div><Link href={`/tools/${tool.slug}`}>Ver análisis</Link>{tool.offer?.affiliate_url && <a href={tool.offer.affiliate_url} rel="sponsored nofollow">Ir a herramienta</a>}</div></article>)}</div> : <div className="hub-empty"><AppWindow size={34}/><h3>Directorio de herramientas en configuración.</h3><p>Las herramientas publicadas aparecerán aquí con su análisis y datos reales.</p><Link className="btn" href="/herramientas-ia">Ver herramientas IA</Link></div>}
          <p className="mt-5 text-center text-xs text-slate-500">Algunos enlaces pueden ser afiliados.</p>
        </div>
      </section>

      <section className="hub-section hub-compare">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:px-6">
          <div><p className="hub-eyebrow">Comparador inteligente</p><h2 className="mt-3 font-display text-4xl font-black text-white">¿No sabes qué herramienta usar? AFFILIX te ayuda a elegir.</h2><p className="mt-4 text-lg leading-8 text-slate-400">Compara herramientas IA, software, cursos y recursos según tu objetivo real.</p>
            <form action="/comparador" className="mt-7 flex flex-col gap-3 sm:flex-row"><input className="input min-h-14" name="q" placeholder="¿Qué quieres crear o automatizar?" aria-label="Objetivo a comparar"/><button className="btn btn-primary shrink-0" type="submit">Recomendar herramienta</button></form>
          </div>
          <div className="grid gap-3">{comparisons.map(x => <Link className="hub-compare-link" href="/comparador" key={x}><GitCompareArrows size={18}/><span>{x}</span><ArrowRight size={16}/></Link>)}</div>
        </div>
      </section>

      <section className="hub-section">
        <SectionHeading eyebrow="Proceso conectado" title="Así funciona AFFILIX." copy="Un único ecosistema para pasar de la necesidad al resultado y seguir creciendo." />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-5 lg:px-6">
          {[[Search,"Elige lo que necesitas.","Producto digital, servicio IA, kit o herramienta."],[WandSparkles,"Compra o genera con IA.","Preparamos el pedido, recurso o recomendación."],[Workflow,"Automatización en segundo plano.","Pagos, generación, entrega, emails y tracking."],[DownloadCloud,"Recibe tu resultado.","Descarga, recibe tu servicio o accede a la herramienta."],[Rocket,"Escala y promociona.","Usa kits, campañas, afiliados y automatización."]].map(([Icon,title,copy],i) => <article className="hub-step" key={title as string}><span>0{i+1}</span><Icon size={24}/><h3>{title as string}</h3><p>{copy as string}</p></article>)}
        </div>
      </section>

      <section className="hub-section hub-section-alt">
        <SectionHeading eyebrow="Hecho para avanzar" title="Creado para personas que quieren moverse rápido." copy="Recursos y rutas directas para cada forma de crear, vender y crecer." />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
          {["Creadores de contenido","Negocios locales","Tiendas online","Músicos","YouTubers","Diseñadores","Agencias","Emprendedores","Afiliados","Vendedores digitales"].map((x,i) => <Link href={i % 3 === 0 ? "/servicios-ia" : i % 3 === 1 ? "/kits-negocio" : "/productos-digitales"} className="hub-audience" key={x}>{x}<ArrowRight size={14}/></Link>)}
        </div>
      </section>

      <section className="hub-section">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_1.1fr] lg:px-6">
          <div><p className="hub-eyebrow">Programa de afiliados</p><h2 className="mt-3 font-display text-4xl font-black">Gana comisiones vendiendo productos digitales y herramientas IA.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Crea tu escaparate, promociona productos digitales, servicios IA, kits y SaaS recomendados, y controla tus clics y comisiones desde tu panel.</p><Link className="btn btn-primary hub-btn mt-7" href="/afiliados">Unirme como afiliado</Link></div>
          <div className="grid gap-3 sm:grid-cols-2">{["Escaparate propio","Enlaces personalizados","Productos autorizados","Material promocional","Comisiones","Analítica","Pagos"].map(x => <div className="hub-benefit" key={x}><Check size={17}/>{x}</div>)}</div>
        </div>
      </section>

      <section className="hub-section hub-section-alt">
        <SectionHeading eyebrow="Formas de acceso" title="Elige cómo quieres usar AFFILIX." copy="Compra lo que necesitas hoy o elige una modalidad preparada para un uso continuo." />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5 lg:px-6">
          {[["Pago único","Compra productos sueltos con licencia y entrega automática.","Disponible"],["Créditos IA","100, 500 o 2.000 créditos para servicios IA.","Disponible"],["Plan Pro","10 servicios IA/mes, 500 créditos y prioridad.","19 EUR/mes"],["Plan Business","50 servicios IA/mes, 3.000 créditos y revisión humana.","79 EUR/mes"],["Afiliado","Promociona y gana comisiones desde el primer euro.","Disponible"]].map(([title,copy,status]) => <article className="hub-plan" key={title}><h3>{title}</h3><p>{copy}</p><span className="hub-status">{status}</span><Link className="mt-4 inline-flex text-sm font-black text-cyan-300" href={title === "Afiliado" ? "/afiliados" : "/planes"}>Empezar <ArrowRight size={14}/></Link></article>)}
        </div>
      </section>

      <section className="hub-section">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Todo lo que necesitas saber." copy="Respuestas directas sobre productos, servicios, herramientas y entregas." />
        <div className="mx-auto max-w-3xl space-y-3 px-4">
          {[
            ["¿AFFILIX vende productos físicos?","No. AFFILIX es una plataforma 100% digital: productos descargables, servicios generados con IA, kits por sector y herramientas SaaS recomendadas. No hay stock, logística ni envíos físicos."],
            ["¿Qué puedo crear con IA?","Logos, flyers, packs para Instagram, guiones, vídeos promocionales, música, portadas, ebooks, menús, imágenes de producto, campañas y kits de marca completos."],
            ["¿Los productos digitales se descargan al momento?","Sí. Cuando Stripe confirma el pago, AFFILIX genera una entrega segura y el enlace aparece en checkout y por email si el canal está activo."],
            ["¿Cómo funcionan los servicios IA?","Eliges un servicio, rellenas el formulario, pagas y AFFILIX ejecuta la generación conectada a MuAPI. Si requiere revisión humana, queda en cola antes de entrega."],
            ["¿Puedo usar los recursos comercialmente?","Depende de la licencia indicada en cada ficha: personal, comercial estándar o extendida. La licencia acompaña la entrega."],
            ["¿Cómo funcionan las herramientas recomendadas?","Curamos herramientas IA y SaaS. Algunos enlaces son afiliados y pueden generar comisión para AFFILIX sin coste añadido para ti."],
            ["¿Puedo ser afiliado?","Sí. Solicitas acceso, te aprobamos, generas enlaces personalizados y cobras comisiones con periodo de retención para cubrir reembolsos."],
            ["¿Cómo recibo mi compra?","Por descarga segura, email o entrega del servicio, según el tipo de producto. Las descargas usan token con caducidad y límite de usos."],
            ["¿Qué pasa si una entrega falla?","Abre un ticket en soporte. Reintentamos, regeneramos el enlace o revisamos reembolso si el fallo es nuestro."],
          ].map(([q,a]) => <details className="hub-faq" key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}
        </div>
      </section>
    </PublicShell>
  );
}
