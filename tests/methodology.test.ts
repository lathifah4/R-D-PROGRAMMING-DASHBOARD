import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseMethodology } from "../lib/methodology";

test("updated methodology separates TV and Content rules from source footers and hides authoring instructions", () => {
  const source = readFileSync(new URL("../METODOLOGI.md", import.meta.url), "utf8");
  for (const section of ["tv", "content"] as const) {
    const parsed = parseMethodology(source.replaceAll("\r\n", "\n"), section);
    assert.ok(parsed.sources.some((text) => text.startsWith("Data TV · Customize:")));
    assert.ok(parsed.sources.some((text) => text.includes("16-22 Okt 2026")));
    assert.equal(parsed.organization, "R&D PROGRAMMING - INEWS MEDIA GROUP");
    assert.ok(!parsed.paragraphs.some((text) => text.startsWith("##") || text === "Metodologi" || text.startsWith("R&D PROGRAMMING")));
  }
  const tv = parseMethodology(source, "tv"), content = parseMethodology(source, "content");
  assert.ok(tv.paragraphs.some((text) => text.startsWith("Kontribusi (")));
  assert.ok(tv.paragraphs.some((text) => text.startsWith("Customize:")));
  assert.ok(!content.paragraphs.some((text) => text.startsWith("Kontribusi (")));
  assert.ok(content.paragraphs.some((text) => text.startsWith("Skor Gabungan")));
  assert.deepEqual(parseMethodology("Untuk Data tv\r\nMetodologi\r\nSumber: TV", "content").paragraphs, []);
});
