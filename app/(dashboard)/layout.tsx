import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SourceFooter } from "@/components/common/methodology";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell footers={{
    "/content": <SourceFooter section="content" />,
    "/data-tv": <SourceFooter section="tv" />,
  }}>{children}</DashboardShell>;
}
