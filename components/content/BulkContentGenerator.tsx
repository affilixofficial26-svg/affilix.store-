export function BulkContentGenerator() {
  return <form action="/api/ai/generate-content" method="post" className="surface grid gap-3 p-4"><input className="input" name="product_id" required /><button className="btn btn-primary">Generar</button></form>;
}
