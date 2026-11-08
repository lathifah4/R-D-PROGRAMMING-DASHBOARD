import { ContentDashboard } from "@/components/content/content-dashboard";
import { Methodology } from "@/components/common/methodology";

export const metadata = { title: "Content | iNews Performance" };

export default function ContentPage() {
  return <ContentDashboard methodology={<Methodology section="content" />} />;
}
