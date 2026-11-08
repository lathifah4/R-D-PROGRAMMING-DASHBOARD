import type { DataRow } from "./dashboard-data";

export const spreadsheetSheets = {
  "performance-monthly": {
    name: "PERFORMANCE MONTHLY",
    range: "A1:E",
    header: "MONTH",
  },
  "performance-weekly": {
    name: "PERFORMANCE WEEKLY",
    range: "A1:E",
    header: "Week",
  },
  "daypart-weekly": {
    name: "BY DAYPART WEEKLY",
    range: "A1:I",
    header: "Year",
  },
  trend: { name: "TREND", range: "A1:J", header: "Year" },
  "program-detail": { name: "Program Detail", range: "A1:M", header: "Month" },
  bulletin: { name: "BULLETIN", range: "A2:L", header: "Month" },
  "agenda-setting": {
    name: "DATABASE AGENDA SETTING",
    range: "A1:AE",
    header: "CHANNEL",
  },
  talkshow: { name: "DATABASE TALKSHOW", range: "A1:J", header: "Month" },
  "narasumber-talkshow": {
    name: "NARASUMBER TALKSHOW",
    range: "A1:M",
    header: "CHANNEL",
  },
  "promo-daily": { name: "CB PROMO DAILY", range: "A1:M", header: "Year" },
  promo: { name: "CB PROMO", range: "A1:M", header: "Year" },
  commercial: { name: "CB COMMERCIAL", range: "A1:M", header: "Year" },
  "commercial-daily": {
    name: "CB COMMERCIAL DAILY",
    range: "A1:M",
    header: "Year",
  },
  advertiser: { name: "Advertiser", range: "A1:G", header: "Year" },
} as const;

export type SheetEndpoint = keyof typeof spreadsheetSheets;
export type SheetName = (typeof spreadsheetSheets)[SheetEndpoint]["name"];
export type SpreadsheetData = Partial<Record<SheetName, DataRow[]>>;

export function isSheetEndpoint(value: string): value is SheetEndpoint {
  return Object.hasOwn(spreadsheetSheets, value);
}

const sheetErrors =
  /^#(?:N\/A|REF!|DIV\/0!|VALUE!|NAME\?|NUM!|NULL!|ERROR!|SPILL!|CALC!)/;

export function parseSheetRows(
  values: unknown[][],
  endpoint: SheetEndpoint,
): DataRow[] {
  if (!values.length) return [];
  const [headerRow, ...records] = values;
  const sheet = spreadsheetSheets[endpoint];
  if (headerRow[0] !== sheet.header) {
    throw new Error(`Header sheet ${sheet.name} tidak sesuai.`);
  }
  const headers = headerRow.flatMap((value, index) =>
    typeof value === "string" && value.trim() && !value.startsWith("#")
      ? [{ key: value, index }]
      : [],
  );
  return records.flatMap((cells) => {
    // BULLETIN can repeat its header between program sections.
    if (headers.every(({ key, index }) => cells[index] === key)) return [];
    const row: DataRow = Object.fromEntries(
      headers.map(({ key, index }) => {
        const value = cells[index];
        return [
          key,
          typeof value === "number" ||
          (typeof value === "string" &&
            value !== "" &&
            !sheetErrors.test(value))
            ? value
            : null,
        ];
      }),
    );
    return Object.values(row).filter((value) => value !== null).length >= 2
      ? [row]
      : [];
  });
}
