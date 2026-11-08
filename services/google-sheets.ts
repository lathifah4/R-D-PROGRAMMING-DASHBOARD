import "server-only";

import { auth, sheets, type sheets_v4 } from "googleapis/build/src/apis/sheets";
import {
  parseSheetRows,
  spreadsheetSheets,
  type SheetEndpoint,
} from "@/lib/spreadsheet-data";

let client: sheets_v4.Sheets | undefined;

export function GetSheetsClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error("Konfigurasi Google Sheets belum lengkap.");
  }
  client ??= sheets({
    version: "v4",
    auth: new auth.GoogleAuth({
      credentials: { client_email: email, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      clientOptions: { transporterOptions: { timeout: 20_000, retry: false } },
    }),
  });
  return client;
}

export function GetSpreadsheetId(source: "datatv" | "content") {
  const id =
    source === "content"
      ? process.env.GOOGLE_SHEETS_CONTENT_ID
      : (process.env.GOOGLE_SHEETS_DATATV_ID ?? process.env.GOOGLE_SHEETS_ID);
  if (!id) throw new Error(`Konfigurasi spreadsheet ${source} belum lengkap.`);
  return id;
}

export async function GetSpreadsheetRows(endpoint: SheetEndpoint) {
  const spreadsheetId = GetSpreadsheetId("datatv");
  const client = GetSheetsClient();
  const sheet = spreadsheetSheets[endpoint];
  const response = await client.spreadsheets.values.get(
    {
      spreadsheetId,
      range: `'${sheet.name.replaceAll("'", "''")}'!${sheet.range}`,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
      majorDimension: "ROWS",
    },
    { timeout: 30_000, retry: false },
  );
  return parseSheetRows(response.data.values ?? [], endpoint);
}
