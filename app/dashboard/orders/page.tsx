import { getAdminDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Order = { id: string; customer_email: string; status: string; total: number | string; currency: string; created_at: string };

export default async function OrdersPage() {
  let orders: Order[] = [];
  try {
    orders = await getAdminDb().select<Order>("customer_orders", {
      select: "id,customer_email,status,total,currency,created_at",
      order: "created_at.desc",
      limit: "100",
    });
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pedidos y entregas</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Pagos, trabajos IA, descargas y entregas del Digital Hub. Cuando Stripe o PayPal confirman pago, AFFILIX crea pedido, evento financiero y entrega segura.
        </p>
      </div>

      {orders.length ? (
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-elevated)]">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Total</th>
                <th className="p-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="p-4">{order.customer_email}</td>
                  <td className="p-4">{order.status}</td>
                  <td className="p-4">{Number(order.total).toFixed(2)} {order.currency}</td>
                  <td className="p-4">{new Date(order.created_at).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface p-8 text-center text-sm text-[var(--text-secondary)]">
          Centro listo para registrar compras. El resultado aparece aqui despues del primer checkout confirmado y tambien en Finanzas y Entregas.
        </div>
      )}
    </div>
  );
}
