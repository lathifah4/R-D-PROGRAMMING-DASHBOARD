import { connection } from "next/server";
import { CONTENT_SHEETS, buildContentDataset } from "@/lib/content-data";
import { GetSheetsClient, GetSpreadsheetId } from "@/services/google-sheets";


export async function GET() {
  await connection();
  try {
    const response = await GetSheetsClient().spreadsheets.values.batchGet(
      {
        spreadsheetId: GetSpreadsheetId("content"),
        ranges: CONTENT_SHEETS.map(
          (name) =>
            `'${name}'!${name === "YOUTUBE" ? "A1:M" : name === "SOCIAL MEDIA" ? "A1:AZ" : "C1:Q"}`,
        ),
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      },
      { timeout: 60_000, retry: false },
    );
    const data = buildContentDataset(
      CONTENT_SHEETS.map((name, index) => ({
        name,
        values: response.data.valueRanges?.[index]?.values ?? [],
      })),
    );
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    
    const message =
      error instanceof Error &&
      /Kolom |Struktur kolom|Tanggal pada|Platform |Konfigurasi /.test(
        error.message,
      )
        ? error.message
        : "Gagal membaca spreadsheet Content. Periksa akses service account dan konversi ke Google Sheets.";
    return Response.json(
      { error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
