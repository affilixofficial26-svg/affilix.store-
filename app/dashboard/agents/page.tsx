import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";

const agents = [
  "MasterAgent", "DashboardAgent", "CatalogAgent", "DigitalProductAgent", "AIServiceAgent", "BusinessKitAgent",
  "SaaSScoutAgent", "ComparatorAgent", "NicheFactoryAgent", "OrderAgent", "DeliveryAgent", "AffiliateAgent",
  "MarketingAgent", "AutomationAgent", "AnalyticsAgent", "FinanceAgent", "SupportAgent", "CleanupAgent", "QAAgent",
];

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <AdminModulePage
        title="Agentes IA"
        description="Control central de agentes, permisos, ultima ejecucion, acciones permitidas y logs."
        emptyTitle="Agentes preparados"
        emptyMessage="Los agentes estan definidos a nivel de panel. Para ejecutar acciones reales falta configurar proveedor IA y permisos seguros."
        agent={{ name: "MasterAgent", status: "pending", description: "Coordina estado general, errores, pedidos pendientes, entregas fallidas y recomendaciones." }}
        pending={["Configura OPENAI_API_KEY o proveedor IA.", "Define permisos de acciones peligrosas antes de publicar, cobrar o borrar."]}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent} className="surface p-4">
            <h2 className="font-display font-bold">{agent}</h2>
            <p className="mt-1 text-xs font-bold text-amber-300">Pendiente de configuracion</p>
          </div>
        ))}
      </div>
    </div>
  );
}
