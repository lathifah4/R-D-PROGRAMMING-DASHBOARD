import { tvBroadcastMinute, tvMean, tvMode, type TvAiring } from "./tv-data";

export type TvProgramGrouping = "date" | "week" | "month" | "program";
export const TV_CUSTOM_COLUMNS = ["Counter", "Channel", "Period", "Program", "Level2", "TVR", "Share", "Start", "End", "Day", "Level1", "Airings", "Audience"] as const;
export type TvCustomColumn = typeof TV_CUSTOM_COLUMNS[number];
export const TV_CUSTOM_HIDDEN: TvCustomColumn[] = ["Start", "End", "Day", "Level1", "Airings", "Audience"];
export const TV_CUSTOM_LABELS: Record<TvCustomColumn, string> = {
  Counter: "Counter", Program: "Description", Channel: "Channel", Period: "Date / Week / Month", Airings: "Jumlah tayang",
  TVR: "TVR", Share: "Share", Audience: "000s", Start: "Start time", End: "End time", Day: "Hari (Day)", Level1: "Level 1", Level2: "Level 2",
};
export type TvCustomRow = { Counter: number; Program: string; Channel: string; Period: string; Day: string; Airings: number;
  TVR: number | null; Share: number | null; Audience: number | null; Start: string; End: string; Level1: string; Level2: string };

export function filterTvPrograms(airings: TvAiring[], channels: string[], dates: string[], include: string[], exclude: string[]) {
  const terms = (values: string[]) => values.map((value) => value.trim().toLocaleLowerCase("id")).filter(Boolean);
  const included = terms(include), excluded = terms(exclude);
  return airings.filter((row) => {
    const name = row.program.toLocaleLowerCase("id");
    return !row.paytv && channels.includes(row.channel) && (!dates.length || dates.includes(row.date)) &&
      (!included.length || included.some((term) => name.includes(term))) && !excluded.some((term) => name.includes(term));
  });
}

export function tvProgramSummary(airings: TvAiring[]) {
  return { Airings: airings.length, TVR: tvMean(airings.map((row) => row.rating)),
    Share: tvMean(airings.map((row) => row.share)), Audience: tvMean(airings.map((row) => row.audience)) };
}

export function customizeTvPrograms(airings: TvAiring[], grouping: TvProgramGrouping): TvCustomRow[] {
  const groups = new Map<string, TvAiring[]>();
  for (const row of airings) {
    const period = grouping === "date" ? row.date : grouping === "week" ? `${row.date.slice(0, 4)} W${row.week}` : grouping === "month" ? row.date.slice(0, 7) : "Semua periode";
    const key = JSON.stringify([row.channel, row.program, period]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].map((rows) => {
    const firstPerDay = [...new Set(rows.map((row) => row.date))].map((date) =>
      rows.filter((row) => row.date === date).sort((a, b) => tvBroadcastMinute(a.start) - tvBroadcastMinute(b.start))[0]);
    const row = rows[0];
    return { Counter: 0, Program: row.program, Channel: row.channel,
      Period: grouping === "date" ? row.date : grouping === "week" ? `${row.date.slice(0, 4)} W${row.week}` : grouping === "month" ? row.date.slice(0, 7) : "Semua periode",
      Day: tvMode(rows.map((item) => new Date(`${item.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }))),
      ...tvProgramSummary(rows), Start: tvMode(firstPerDay.map((item) => item.start)), End: tvMode(firstPerDay.map((item) => item.end)),
      Level1: tvMode(rows.map((item) => item.level1)), Level2: tvMode(rows.map((item) => item.level2)) };
  }).sort((a, b) => b.Period.localeCompare(a.Period, "id", { numeric: true }) || (b.Audience ?? -Infinity) - (a.Audience ?? -Infinity))
    .map((row, index) => ({ ...row, Counter: index + 1 }));
}

export function tvCalendarMonths(dates: string[]) {
  return [...new Set(dates.map((date) => date.slice(0, 7)))].sort().map((key) => {
    const [year, month] = key.split("-").map(Number);
    const first = Date.UTC(year, month - 1, 1);
    const offset = new Date(first).getUTCDay();
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const weeks = Array.from({ length: Math.ceil((offset + length) / 7) }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => new Date(first + (week * 7 + day - offset) * 86400000).toISOString().slice(0, 10)));
    const label = `${year} ${new Date(first).toLocaleDateString("id-ID", { month: "long", timeZone: "UTC" })}`;
    return { key, label, weeks };
  });
}

export function tvCalendarRange(dates: string[], from: string, to: string) {
  return from && to && from <= to ? dates.filter((date) => date >= from && date <= to) : [];
}

export function tvColumnOrder(values: unknown): TvCustomColumn[] {
  const known = Array.isArray(values) ? [...new Set(values.filter((value): value is TvCustomColumn => TV_CUSTOM_COLUMNS.includes(value)))] : [];
  return [...known, ...TV_CUSTOM_COLUMNS.filter((value) => !known.includes(value))];
}
