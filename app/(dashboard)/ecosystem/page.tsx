import { EcosystemDashboard } from "@/components/ecosystem/ecosystem-dashboard";
import { DashboardDataBoundary } from "@/components/dashboard/dashboard-context";

export const metadata = { title: "Ecosystem | iNews Performance" };

export default function EcosystemPage() {
  return (
    <DashboardDataBoundary>
      <EcosystemDashboard />
    </DashboardDataBoundary>
  );
}
