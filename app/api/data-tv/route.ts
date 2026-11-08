import { connection } from "next/server";
import { TV_SHEETS, buildTvDataset, resolveTvSheets } from "@/lib/tv-data";
import { GetSheetsClient, GetSpreadsheetId } from "@/services/google-sheets";

export async function GET() {
  await connection();
  try {
    const client = GetSheetsClient();
    const spreadsheetId = GetSpreadsheetId("datatv");
    const metadata = await client.spreadsheets.get(
      { spreadsheetId, fields: "sheets(properties(title))" },
      { timeout: 20_000, retry: false },
    );
    const resolved = resolveTvSheets(metadata.data.sheets?.flatMap((sheet) => sheet.properties?.title ? [sheet.properties.title] : []) ?? []);
    const available = new Set(resolved.map((sheet) => sheet.name));
    const required = TV_SHEETS.slice(0, 8).filter(
      (name) => name !== "PERFORMANCE DAILY PAYTV" && !available.has(name),
    );
    if (required.length)
      throw new Error(`Sheet Data TV belum tersedia: ${required.join(", ")}.`);
    const response = await client.spreadsheets.values.batchGet(
      {
        spreadsheetId,
        ranges: resolved.map(
          ({ name, title }) =>
            `'${title.replaceAll("'", "''")}'!A1:${name.startsWith("PERFORMANCE M") || name === "PERFORMANCE WEEKLY" ? "Y" : name.startsWith("Program Detail") ? "T" : name === "PERFORMANCE DAILY PAYTV" ? "D" : "V"}`,
        ),
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      },
      { timeout: 60_000, retry: false },
    );
    const data = buildTvDataset(
      resolved.map(({ name }, index) => ({
        name,
        values: response.data.valueRanges?.[index]?.values ?? [],
      })),
    );
    return Response.json({ ...data, sourceSheets: Object.fromEntries(resolved.map(({ name, title }) => [name, title])) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "Data TV spreadsheet:",
      error instanceof Error ? error.message : "Unknown error",
    );
    const message =
      error instanceof Error &&
      /Sheet Data TV|Header sheet|Tanggal pada|Konfigurasi /.test(error.message)
        ? error.message
        : "Gagal membaca spreadsheet Data TV. Periksa akses service account dan format sheet.";
    return Response.json(
      { error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
