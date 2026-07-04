import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="min-w-0">
        <TopBar />
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
