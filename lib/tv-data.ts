import { contentDate } from "./content-data";

export const TV_SHEETS = [
  "PERFORMANCE MONTHLY",
  "PERFORMANCE WEEKLY",
  "PERFORMANCE DAILY",
  "PERFORMANCE DAILY PAYTV",
  "SHARE DAYPART MONTHLY",
  "SHARE DAYPART WEEKLY",
  "SHARE DAYPART DAILY",
  "Program Detail REV2",
  "Program Detail Others",
  "Program Detail Paytv",
  "Kontribusi By Daypart",
] as const;
export const TV_NEWS_CHANNELS = ["INEWS", "TVONE", "KOMPASTV", "METRO", "CNN INDONESIA", "GARUDATV", "SINPO", "NUSANTARATV"];
export type TvPeriod = {
  key: string;
  first: string;
  last: string;
  week: number;
  shares: Record<string, number | null>;
};
export type TvDaypart = {
  key: string;
  daypart: string;
  shares: Record<string, number | null>;
};
export type TvAiring = {
  date: string;
  week: number;
  channel: string;
  program: string;
  start: string;
  duration: number;
  category: string;
  rating: number | null;
  share: number | null;
  audience: number | null;
  paytv: boolean;
  source?: string;
  end?: string;
  level1?: string;
  level2?: string;
};
export type TvDataset = {
  channels: string[];
  monthly: TvPeriod[];
  weekly: TvPeriod[];
  daily: TvPeriod[];
  paytvDaily: TvPeriod[];
  paytvWeekly: TvPeriod[];
  dayparts: { monthly: TvDaypart[]; weekly: TvDaypart[]; daily: TvDaypart[] };
  airings: TvAiring[];
  contributions?: { date: string; week: number; audience: Record<string, number | null> }[];
  missing: string[];
  sourceSheets?: Record<string, string>;
};

export function resolveTvSheets(titles: string[]) {
  const normalized = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TV_SHEETS.flatMap((name) => {
    const matches = titles.filter((title) => normalized(title) === normalized(name));
    const title = titles.includes(name) ? name : matches.length === 1 ? matches[0] : undefined;
    if (!title && matches.length > 1) throw new Error(`Sheet Data TV ambigu untuk ${name}: ${matches.join(", ")}.`);
    return title ? [{ name, title }] : [];
  });
}

export function tvProgramChannels(data: Pick<TvDataset, "channels" | "airings">) {
  return [...new Set([
    ...data.channels,
    ...data.airings.filter((row) => !row.paytv).map((row) => row.channel),
  ])];
}

export const TV_MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const channelName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace("GARUDA TV", "GARUDATV");
const numeric = (value: unknown) =>
  (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) ? Number(value) : null;
const weekNumber = (value: unknown) =>
  Number(value) > 100 ? Number(value) % 100 : Number(value) || 0;
const tvTime = (value: unknown) => {
  if (typeof value !== "number") return String(value ?? "").trim();
  const minutes = Math.round(value * 1440);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function tvPerformanceWeek(date: string) {
  const current = new Date(`${date}T00:00:00Z`);
  const january = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const firstSunday = january.getTime() + ((7 - january.getUTCDay()) % 7) * 86400000;
  return Math.max(1, Math.floor((current.getTime() - firstSunday) / (7 * 86400000)) + 1);
}

export function buildTvDataset(
  tables: { name: string; values: unknown[][] }[],
): TvDataset {
  const source = new Map(tables.map((table) => [table.name, table.values]));
  function daily(name: string): TvPeriod[] {
    const [headers = [], ...rows] = source.get(name) ?? [];
    return rows
      .filter((row) => row[0] !== undefined && row[0] !== null && row[0] !== "")
      .map((row) => {
        const date = contentDate(row[0]);
        if (!date) throw new Error(`Tanggal pada sheet ${name} tidak valid.`);
        return {
          key: date,
          first: date,
          last: date,
          week: tvPerformanceWeek(date),
          shares: Object.fromEntries(
            headers
              .slice(2)
              .flatMap((header, index) =>
                header ? [[channelName(header), numeric(row[index + 2])]] : [],
              ),
          ),
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }
  const days = daily("PERFORMANCE DAILY");
  const paytvDays = daily("PERFORMANCE DAILY PAYTV");
  const year = days[0]?.key.slice(0, 4) ?? "2026";
  function periods(name: string, paytv = false): TvPeriod[] {
    const rows = source.get(name) ?? [];
    const headerIndex = rows.findIndex((row) =>
      ["MONTH", "WEEK"].includes(String(row[0]).toUpperCase()),
    );
    if (headerIndex < 0) throw new Error(`Header sheet ${name} tidak sesuai.`);
    const headers = rows[headerIndex];
    const offset = paytv
      ? headers.findIndex(
          (value, index) =>
            index > 0 &&
            ["MONTH", "YEAR", "WEEK"].includes(String(value).toUpperCase()),
        )
      : 0;
    if (offset < 0) return [];
    const channels: [number, string][] = [];
    for (
      let index = offset + 1;
      index < headers.length && headers[index];
      index++
    )
      channels.push([index, channelName(headers[index])]);
    const result: TvPeriod[] = [];
    for (const row of rows.slice(headerIndex + 1)) {
      if (row[0] === undefined || row[0] === null || row[0] === "") continue;
      if (["MONTH", "WEEK", "YEAR"].includes(String(row[0]).toUpperCase()))
        break;
      if (paytv && (row[offset] === undefined || row[offset] === null || row[offset] === "")) continue;
      const period = row[paytv ? offset : 0];
      const month = TV_MONTHS.indexOf(String(period).trim().toUpperCase());
      const weekly = name.endsWith("WEEKLY");
      if (!weekly && month < 0) break;
      const week = weekly ? weekNumber(period) : 0;
      if (weekly && (week < 1 || week > 53)) break;
      const matching = (paytv ? paytvDays : days).filter((day) =>
        weekly ? day.week === week : Number(day.key.slice(5, 7)) === month + 1,
      );
      const key = weekly
        ? String(week)
        : `${year}-${String(month + 1).padStart(2, "0")}`;
      result.push({
        key,
        first: matching[0]?.first ?? "",
        last: matching.at(-1)?.last ?? "",
        week,
        shares: Object.fromEntries(
          channels.map(([index, channel]) => [channel, numeric(row[index])]),
        ),
      });
    }
    return result;
  }
  function dayparts(
    name: string,
    period: "monthly" | "weekly" | "daily",
  ): TvDaypart[] {
    const [headers = [], ...rows] = source.get(name) ?? [];
    return rows.flatMap((row) => {
      if (row[0] === undefined || row[0] === null || !row[1]) return [];
      const month = TV_MONTHS.indexOf(String(row[0]).trim().toUpperCase());
      const key =
        period === "daily"
          ? contentDate(row[0])
          : period === "weekly"
            ? String(weekNumber(row[0]))
            : month < 0
              ? ""
              : `${year}-${String(month + 1).padStart(2, "0")}`;
      return key
        ? [
            {
              key,
              daypart: String(row[1]).trim(),
              shares: Object.fromEntries(
                headers
                  .slice(2)
                  .flatMap((header, index) =>
                    header
                      ? [[channelName(header), numeric(row[index + 2])]]
                      : [],
                  ),
              ),
            },
          ]
        : [];
    });
  }
  const airings: TvAiring[] = [];
  for (const name of [
    "Program Detail REV2",
    "Program Detail Others",
    "Program Detail Paytv",
  ]) {
    const [headers = [], ...rows] = source.get(name) ?? [];
    const keys = headers.map((value) => String(value).trim().toUpperCase());
    if (!rows.length) continue;
    const read = (row: unknown[], key: string) => row[keys.indexOf(key)];
    for (const row of rows) {
      if (!read(row, "CHANNEL")) continue;
      const date = contentDate(read(row, "DATE"));
      if (!date) throw new Error(`Tanggal pada sheet ${name} tidak valid.`);
      airings.push({
        date,
        week: weekNumber(read(row, "WEEK") ?? read(row, "ISO WEEK")),
        channel: channelName(read(row, "CHANNEL")),
        program: String(
          (name === "Program Detail Paytv" ? read(row, "DESCRIPTION") : read(row, "PROGRAM")) ?? "",
        ).trim(),
        start: tvTime(read(row, "START TIME")),
        end: tvTime(read(row, "END TIME")),
        level1: String(read(row, "LEVEL 1") ?? "").trim(),
        level2: String(read(row, "LEVEL 2") ?? "").trim(),
        duration: numeric(read(row, "DUR")) ?? 0,
        category: String(read(row, "CATEGORY") ?? "")
          .trim()
          .toUpperCase(),
        rating: numeric(read(row, "TVR")),
        share: numeric(read(row, "SHARE")),
        audience: numeric(read(row, "000S")),
        paytv: name === "Program Detail Paytv",
        source: name,
      });
    }
  }
  const monthly = periods("PERFORMANCE MONTHLY");
  const [contributionHeaders = [], ...contributionRows] = source.get("Kontribusi By Daypart") ?? [];
  const contributionKeys = contributionHeaders.map((value) => String(value).trim().toUpperCase());
  const contributions = contributionRows.flatMap((row) => {
    if (channelName(row[contributionKeys.indexOf("CHANNEL")]) !== "TOTAL TV") return [];
    const date = contentDate(row[contributionKeys.indexOf("DATE")]);
    if (!date) throw new Error("Tanggal pada sheet Kontribusi By Daypart tidak valid.");
    return [{ date, week: weekNumber(row[contributionKeys.indexOf("WEEK")]),
      audience: Object.fromEntries(contributionHeaders.flatMap((header, index) =>
        /^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(String(header).trim())
          ? [[String(header).trim().replace(/\s*-\s*/, " - "), numeric(row[index])]] : [])) }];
  });
  return {
    channels: Object.keys(monthly[0]?.shares ?? {}),
    monthly,
    weekly: periods("PERFORMANCE WEEKLY"),
    daily: days,
    paytvDaily: paytvDays,
    paytvWeekly: periods("PERFORMANCE WEEKLY", true),
    dayparts: {
      monthly: dayparts("SHARE DAYPART MONTHLY", "monthly"),
      weekly: dayparts("SHARE DAYPART WEEKLY", "weekly"),
      daily: dayparts("SHARE DAYPART DAILY", "daily"),
    },
    airings,
    contributions,
    missing: TV_SHEETS.filter((name) => !source.has(name)),
  };
}

export function tvBroadcastMinute(time: string) {
  if (!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(time)) return NaN;
  const [hour, minute, second = 0] = time.split(":").map(Number);
  if (minute > 59 || second > 59) return NaN;
  return (hour < 2 ? hour + 24 : hour) * 60 + minute + second / 60;
}

export function tvMode(values: (string | undefined)[]) {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export function tvProgramAirings(segments: TvAiring[]) {
  const days = new Map<string, TvAiring[]>();
  for (const segment of segments) {
    if (!(segment.duration > 0)) continue;
    const key = JSON.stringify([segment.channel, segment.date, segment.paytv]);
    const rows = days.get(key) ?? [];
    rows.push(segment);
    days.set(key, rows);
  }
  return [...days.values()].flatMap((rows) => {
    const groups: TvAiring[][] = [];
    const candidates = new Map<string, TvAiring[]>();
    for (const row of [...rows].sort((a, b) => tvBroadcastMinute(a.start) - tvBroadcastMinute(b.start))) {
      const filler = [row.level1, row.level2, row.category, row.program]
        .some((value) => /^filler\b/i.test(value ?? ""));
      const previous = candidates.get(row.program);
      let group: TvAiring[];
      if (previous && tvBroadcastMinute(row.start) > tvBroadcastMinute(previous.at(-1)!.start)) {
        group = previous;
        group.push(row);
      } else {
        group = [row];
        groups.push(group);
      }
      if (!filler || !Number.isFinite(tvBroadcastMinute(row.start))) candidates.clear();
      if (Number.isFinite(tvBroadcastMinute(row.start))) candidates.set(row.program, group);
    }
    return groups.map((group) => {
      const weighted = (metric: "rating" | "share" | "audience") => {
        const valid = group.filter((row) => row[metric] !== null && row.duration > 0);
        const duration = valid.reduce((sum, row) => sum + row.duration, 0);
        return duration ? valid.reduce((sum, row) => sum + row[metric]! * row.duration, 0) / duration : null;
      };
      return { ...group[0], end: group.at(-1)!.end,
        duration: group.reduce((sum, row) => sum + row.duration, 0),
        rating: weighted("rating"), share: weighted("share"), audience: weighted("audience"),
        level1: tvMode(group.map((row) => row.level1)), level2: tvMode(group.map((row) => row.level2)) };
    });
  });
}

export function topTvPrograms(airings: TvAiring[]) {
  const groups = new Map<
    string,
    {
      Program: string;
      Channel: string;
      Airings: number;
      Audience: number;
      TVR: number;
      Share: number;
      AudienceCount: number;
      RatingCount: number;
      ShareCount: number;
    }
  >();
  for (const airing of tvProgramAirings(airings)) {
    const key = JSON.stringify([airing.channel, airing.program]);
    const group = groups.get(key) ?? {
      Program: airing.program,
      Channel: airing.channel,
      Airings: 0,
      Audience: 0,
      TVR: 0,
      Share: 0,
      AudienceCount: 0,
      RatingCount: 0,
      ShareCount: 0,
    };
    group.Airings++;
    group.Audience += airing.audience ?? 0;
    group.TVR += airing.rating ?? 0;
    group.Share += airing.share ?? 0;
    group.AudienceCount += airing.audience === null ? 0 : 1;
    group.RatingCount += airing.rating === null ? 0 : 1;
    group.ShareCount += airing.share === null ? 0 : 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map(({ AudienceCount, RatingCount, ShareCount, ...group }) => ({
      ...group,
      Audience: AudienceCount ? group.Audience / AudienceCount : null,
      TVR: RatingCount ? group.TVR / RatingCount : null,
      Share: ShareCount ? group.Share / ShareCount : null,
    }))
    .sort((a, b) => (b.Audience ?? -Infinity) - (a.Audience ?? -Infinity))
    .slice(0, 30);
}

export function sprBlocks(airings: TvAiring[]) {
  const starts = new Map<number, TvAiring>();
  const broadcastMinute = (airing: TvAiring) => tvBroadcastMinute(airing.start);
  for (const airing of [...airings].sort((a, b) => broadcastMinute(a) - broadcastMinute(b))) {
    if (airing.duration <= 0) continue;
    const start = Math.round((broadcastMinute(airing) - 120) / 5);
    if (Number.isFinite(start) && start >= 0 && start < 288)
      starts.set(start, airing);
  }
  const blocks = [...starts].sort(([a], [b]) => a - b);
  return blocks.map(([start, airing], index) => ({
    start,
    span: (blocks[index + 1]?.[0] ?? 288) - start,
    airing,
  }));
}

export function tvMean(values: (number | null | undefined)[]) {
  const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
}

export function matchesTvDate(date: string, week: number, months: string[], weeks: string[], dates: string[] = []) {
  return (!months.length || months.includes(date.slice(0, 7))) &&
    (!weeks.length || weeks.includes(String(week))) && (!dates.length || dates.includes(date));
}

export function tvFreshComposition(airings: TvAiring[], channels: string[]) {
  return channels.flatMap((channel) => {
    const rows = airings.filter((row) => row.channel === channel && !row.paytv && row.source === "Program Detail REV2");
    if (!rows.length) return [];
    const days = new Set(rows.map((row) => row.date)).size;
    const total = rows.reduce((sum, row) => sum + row.duration, 0);
    const fresh = rows.filter((row) => row.category.toUpperCase() === "FRESH").reduce((sum, row) => sum + row.duration, 0);
    const rerun = rows.filter((row) => row.category.toUpperCase() === "RERUN").reduce((sum, row) => sum + row.duration, 0);
    const unclassified = rows.filter((row) => !["FRESH", "RERUN"].includes(row.category.toUpperCase())).length;
    const available = total > 0 && unclassified < rows.length;
    return [{ Channel: channel, Fresh: available ? fresh / total * 100 : null, Rerun: available ? rerun / total * 100 : null,
      FreshHours: available ? fresh / days / 60 : null, RerunHours: available ? rerun / days / 60 : null,
      Unclassified: total ? Math.max(0, total - fresh - rerun) / total * 100 : 0,
      UnclassifiedHours: Math.max(0, total - fresh - rerun) / days / 60,
      UnclassifiedAirings: unclassified }];
  });
}

export function tvPeriodPartial(period: TvPeriod) {
  if (!period.first || !period.last) return false;
  if (period.week) {
    const duration = (Date.parse(period.last) - Date.parse(period.first)) / 86400000 + 1;
    return period.week === 1 ? !period.first.endsWith("01-01") || !period.last.endsWith("01-10") :
      duration !== 7 || new Date(`${period.first}T00:00:00Z`).getUTCDay() !== 0;
  }
  const [year, month] = period.key.split("-").map(Number);
  return period.first !== `${period.key}-01` || period.last !== `${period.key}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
}

export const TV_DAYPART_LABELS: Record<string, string> = {
  "02:00 - 04:29": "Early Morning 02:00–04:29",
  "04:30 - 09:59": "Morning 04:30–09:59",
  "10:00 - 12:59": "Noon 1 10:00–12:59",
  "13:00 - 15:59": "Noon 2 13:00–15:59",
  "16:00 - 17:59": "Evening 16:00–17:59",
  "18:00 - 21:59": "Prime Time 18:00–21:59",
  "22:00 - 23:59": "Night 22:00–23:59",
  "24:00 - 25:59": "Midnight 24:00–25:59",
};

export function tvDaypartChannels(data: TvDataset) {
  return [...new Set([...data.channels, ...Object.values(data.dayparts).flat().flatMap((row) => Object.keys(row.shares))])]
    .filter((channel) => !["SINDONEWS TV", "IDX CHANNEL"].includes(channel));
}

export function tvDaypartPeriods(data: TvDataset, months: string[], weeks: string[], dates: string[]) {
  const level = dates.length ? "daily" : weeks.length ? "weekly" : "monthly";
  const periods = data[level].filter((row) => level === "daily"
    ? matchesTvDate(row.key, row.week, months, weeks, dates)
    : level === "weekly" ? weeks.includes(String(row.week)) : !months.length || months.includes(row.key));
  const trendLevel = dates.length || weeks.length === 1 || (!weeks.length && months.length === 1)
    ? "daily" : weeks.length ? "weekly" : "monthly";
  const trendPeriods = data[trendLevel].filter((row) => trendLevel === "daily"
    ? matchesTvDate(row.key, row.week, months, weeks, dates)
    : trendLevel === "weekly" ? weeks.includes(String(row.week)) : !months.length || months.includes(row.key));
  return { level, periods, trendLevel, trendPeriods } as const;
}

export function tvNewsLead(shares: Record<string, number | null>) {
  const own = shares.INEWS;
  return typeof own === "number" && ["TVONE", "KOMPASTV", "METRO"]
    .every((channel) => typeof shares[channel] === "number" && own > shares[channel]!);
}

export function tvDaypartContributions(data: TvDataset, months: string[], weeks: string[], dates: string[]) {
  const totals: Record<string, number> = {};
  for (const row of data.contributions ?? []) {
    if (!matchesTvDate(row.date, row.week, months, weeks, dates)) continue;
    for (const [daypart, audience] of Object.entries(row.audience)) {
      if (audience === null) continue;
      const [start, end] = daypart.split(" - ");
      const minutes = tvBroadcastMinute(end) - tvBroadcastMinute(start) + 1;
      if (!Number.isFinite(minutes) || minutes <= 0) continue;
      totals[daypart] = (totals[daypart] ?? 0) + audience * minutes;
    }
  }
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return total > 0 ? Object.fromEntries(Object.entries(totals).map(([name, value]) => [name, value / total * 100])) : {};
}

export function tvDaypartSummary(data: TvDataset, level: "monthly" | "weekly" | "daily", keys: string[], names: string[]) {
  const channels = tvDaypartChannels(data);
  const periods = data[level];
  const selected = data.dayparts[level].filter((row) => keys.includes(row.key));
  const index = keys.length === 1 ? periods.findIndex((row) => row.key === keys[0]) : -1;
  const previous = index > 0 ? periods[index - 1] : undefined;
  return names.map((name) => {
    const rows = selected.filter((row) => row.daypart === name);
    const shares = Object.fromEntries(channels.map((channel) => [channel, tvMean(rows.map((row) => row.shares[channel]))]));
    const own = shares.INEWS;
    const before = previous ? tvMean(data.dayparts[level].filter((row) => row.key === previous.key && row.daypart === name).map((row) => row.shares.INEWS)) : null;
    return { Daypart: TV_DAYPART_LABELS[name] ?? name, Share: own,
      Rank: own === null || own === undefined ? null : 1 + Object.values(shares).filter((value) => value !== null && value > own).length,
      Change: own !== null && own !== undefined && before !== null ? own - before : null };
  });
}
