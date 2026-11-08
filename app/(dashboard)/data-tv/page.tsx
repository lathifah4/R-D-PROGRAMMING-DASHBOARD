import { DataTvDashboard } from "@/components/data-tv/data-tv-dashboard";
import { Methodology } from "@/components/common/methodology";

export const metadata = { title: "Data TV | iNews Performance" };

export default function DataTvPage() {
  return <DataTvDashboard methodology={<Methodology section="tv" />} />;
}
