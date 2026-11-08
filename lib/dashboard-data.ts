import { channels, months, type Channel } from "@/constants/navigation";

export type DataRow = Record<string, string | number | null>;
export type Filters = {
  channel: Channel | "all";
  year: string;
  month: string;
  week: string;
  from: string;
  to: string;
};

export const DEFAULT_FILTERS: Filters = {
  channel: "all",
  year: "2026",
  month: "all",
  week: "all",
  from: "",
  to: "",
};

export const channelColors = {
  INEWS: "#c41e3a",
  TVONE: "#d97706",
  KOMPASTV: "#0e7490",
  METRO: "#6b7280",
  GTV: "var(--color-zinc-200)",
  ANTV: "var(--color-red-800)",
  RTV: "var(--color-zinc-500)",
  MDTV: "var(--color-zinc-600)",
  RCTI: "var(--color-zinc-700)",
  TRANS: "var(--color-zinc-800)",
  TRANS7: "var(--color-zinc-900)",
  IVM: "var(--color-zinc-700)",
  SCTV: "var(--color-zinc-800)",
  MNCTV: "var(--color-zinc-900)",
  MENTARI: "var(--color-zinc-600)",
  MOJI: "var(--color-red-800)",
  SINPO: "var(--color-zinc-700)",
  GARUDATV: "var(--color-red-400)",
  "CNN INDONESIA": "var(--color-zinc-900)",
  NUSANTARATV: "var(--color-zinc-500)",
};

export function numeric(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function average(rows: DataRow[], key: string) {
  const valid = rows.filter(
    (row) => row[key] !== null && row[key] !== undefined,
  );
  return valid.length
    ? valid.reduce((sum, row) => sum + numeric(row[key]), 0) / valid.length
    : 0;
}

export function sum(rows: DataRow[], key: string) {
  return rows.reduce((total, row) => total + numeric(row[key]), 0);
}

export function rowChannel(row: DataRow) {
  return String(row.Channel ?? row.CHANNEL ?? "");
}

export function rowWeek(row: DataRow) {
  const value = numeric(
    row["Week Ariana"] ?? row.Week ?? row["ISO Week"] ?? row.Weekly,
  );
  return value > 100 ? value % 100 : value;
}

export function rowDate(row: DataRow): string {
  const value = row.Date ?? row["Custome Date"] ?? row.TANGGAL;
  if (typeof value === "number")
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000)
      .toISOString()
      .slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10);
  const week = rowWeek(row);
  if (!week) return "";
  const year = numeric(row.Year ?? row.YEAR) || 2026;
  const january4 = new Date(Date.UTC(year, 0, 4));
  const monday =
    january4.getTime() - ((january4.getUTCDay() + 6) % 7) * 86400000;
  return new Date(monday + (week - 1) * 7 * 86400000)
    .toISOString()
    .slice(0, 10);
}

export function rowMonth(row: DataRow) {
  const value = row.Month ?? row.MONTH;
  if (value) return String(value).toLowerCase();
  const date = rowDate(row);
  return date ? months[new Date(date).getUTCMonth()].toLowerCase() : "";
}

export function matchesFilters(row: DataRow, filters: Filters) {
  const date = rowDate(row);
  const year = String(
    row.Year ?? row.YEAR ?? (date ? date.slice(0, 4) : "2026"),
  );
  return (
    (filters.channel === "all" || rowChannel(row) === filters.channel) &&
    (filters.year === "all" || year === filters.year) &&
    (filters.month === "all" ||
      rowMonth(row) === filters.month.toLowerCase()) &&
    (filters.week === "all" || rowWeek(row) === Number(filters.week)) &&
    (!filters.from || (!!date && date >= filters.from)) &&
    (!filters.to || (!!date && date <= filters.to))
  );
}

export function getRows(rows: DataRow[], filters: Filters) {
  return rows.filter((row) => matchesFilters(row, filters));
}

export const number = (value: unknown, digits = 0) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numeric(value));

export function compact(value: number) {
  if (value >= 1e9) return `${number(value / 1e9, 2)} M`;
  if (value >= 1e6) return `${number(value / 1e6, 2)} jt`;
  if (value >= 1e3) return `${number(value / 1e3, 1)} rb`;
  return number(value, 1);
}

export function displayDate(value: string) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "—";
}

export function groupRows(
  rows: DataRow[],
  key: string | ((row: DataRow) => string),
) {
  const groups = new Map<string, DataRow[]>();
  for (const row of rows) {
    const label =
      typeof key === "function"
        ? key(row)
        : String(row[key] ?? "Tidak diketahui");
    const group = groups.get(label);
    if (group) group.push(row);
    else groups.set(label, [row]);
  }
  return groups;
}

export type ChartPoint = { label: string; [key: string]: string | number };

export function trendSeries(
  rows: DataRow[],
  metric: string,
  period: "monthly" | "weekly",
): ChartPoint[] {
  const periods = new Map<number, DataRow[]>();
  for (const row of rows) {
    const index =
      period === "weekly"
        ? rowWeek(row)
        : months.findIndex((month) => month.toLowerCase() === rowMonth(row));
    if (index < 0) continue;
    periods.set(index, [...(periods.get(index) ?? []), row]);
  }
  return [...periods]
    .sort(([a], [b]) => a - b)
    .map(([index, records]) => ({
      label: period === "weekly" ? `W${index}` : months[index].slice(0, 3),
      ...Object.fromEntries(
        channels
          .filter((channel) =>
            records.some((row) => rowChannel(row) === channel),
          )
          .map((channel) => [
            channel,
            average(
              records.filter((row) => rowChannel(row) === channel),
              metric,
            ),
          ]),
      ),
    }));
}

export function downloadCsv(rows: DataRow[], name: string) {
  if (!rows.length) return;
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const cell = (value: unknown) => {
    const raw = String(value ?? "");
    const safe =
      typeof value === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `inews-${name}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
