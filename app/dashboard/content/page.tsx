export default function ContentPage() {
  return (
    <div className="surface p-6" data-help="Generador de contenido IA para productos: crea descripción, review y SEO usando el provider configurado.">
      <h1 className="font-display text-3xl font-bold">Generador de contenido IA</h1>
      <form action="/api/ai/generate-content" method="post" className="mt-6 grid gap-4">
        <input className="input" data-help="ID del producto guardado en Supabase al que quieres generar contenido." name="product_id" placeholder="ID del producto" required />
        <button className="btn btn-primary" data-help="Genera descripción, review, título SEO y meta descripción para ese producto." type="submit">Generar descripción, review y SEO</button>
      </form>
    </div>
  );
}
