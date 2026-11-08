export function parseMethodology(source: string, section: "tv" | "content") {
  const [tv = "", content = ""] = source.split(/^untuk content\s*$/im);
  const [method = "", sources = ""] = (section === "tv" ? tv : content)
    .split(/^## Untuk bagian bawah[^\r\n]*$/im);
  const lines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    paragraphs: lines(method).filter((line) => !/^(Metodologi|Untuk Data tv)$/i.test(line)),
    sources: lines(sources).filter((line) => !line.startsWith("R&D PROGRAMMING")),
    organization: lines(sources).find((line) => line.startsWith("R&D PROGRAMMING")),
  };
}
