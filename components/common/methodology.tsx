import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseMethodology } from "@/lib/methodology";
import { ContentCodingStatus } from "@/components/content/content-coding-status";

const comparisonLabels: Record<string, string> = {
  "Kompetitor Unggul": "competitor",
  Seimbang: "balanced",
  "iNews Unggul": "own",
  "[Cluster] Unggul": "own",
};

function Paragraph({ text, statusLabels = false }: { text: string; statusLabels?: boolean }) {
  const separator = text.indexOf(":");
  const body = text.slice(separator + 1);
  return <>
    {separator !== -1 && <strong>{text.slice(0, separator + 1)}</strong>}
    {statusLabels ? body.split(/(Kompetitor Unggul|Seimbang|iNews Unggul|\[Cluster\] Unggul)/g).map((part, index) =>
      comparisonLabels[part] ? <span key={index} className="methodology-status" data-status={comparisonLabels[part]}>{part}</span> : part,
    ) : body}
  </>;
}

export async function Methodology({ section }: { section: "tv" | "content" }) {
  "use cache";
  const source = await readFile(join(process.cwd(), "METODOLOGI.md"), "utf8");
  const { paragraphs } = parseMethodology(source, section);
  return <aside className="builder-method" aria-label={`Metodologi ${section === "tv" ? "Data TV" : "Content"}`}>
    <h3>Metodologi</h3>
    <ul>
      {paragraphs.map((paragraph) => section === "content" && paragraph.startsWith("Status data (mockup):")
        ? <ContentCodingStatus key={paragraph} />
        : <li key={paragraph}><Paragraph text={paragraph} statusLabels={section === "content"} /></li>)}
    </ul>
  </aside>;
}

export async function SourceFooter({ section }: { section: "tv" | "content" }) {
  "use cache";
  const source = await readFile(join(process.cwd(), "METODOLOGI.md"), "utf8");
  const { sources, organization } = parseMethodology(source, section);
  return sources.length > 0 && <footer className="builder-sources" aria-label="Sumber data">
    {sources.map((paragraph) => <p key={paragraph}><Paragraph text={paragraph} /></p>)}
    {organization && <p className="builder-sources-org">{organization}</p>}
  </footer>;
}
