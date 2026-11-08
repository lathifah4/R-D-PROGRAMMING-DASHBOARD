import { test } from "node:test";
import assert from "node:assert/strict";
import { contentComparison, contentTopics, contentClusterTopics, type ContentDay } from "../lib/content-data";
import { buildTvDataset, tvDaypartPeriods, tvDaypartContributions, tvDaypartSummary, tvNewsLead, sprBlocks, topTvPrograms, tvFreshComposition, type TvAiring, type TvDataset } from "../lib/tv-data";

const close = (actual: number | null | undefined, expected: number) => {
  assert.equal(typeof actual, "number");
  assert.ok(Math.abs(actual! - expected) < 1e-10, `${actual} != ${expected}`);
};
const content = (topic: string, cluster: string, exposure: number, duration = 1, platform: "TV" | "YouTube" = "TV"): ContentDay => ({
  topic, cluster, exposure, duration, platform, date: "2026-09-01", views: platform === "YouTube" ? exposure : 0, posts: 1, likes: 0, comments: 0, shares: 0,
});

test("Builder contribution rounds to two decimals while retaining tiny topics and raw metrics", () => {
  const days = [content("Kecil", "iNews", 1), content("Besar", "iNews", 100000), content("", "iNews", 899999), content("Kompetitor", "TVOne", 90000000)];
  const topics = contentTopics(days);
  assert.equal(topics.length, 2);
  const small = topics.find((row) => row.topic === "Kecil")!;
  const big = topics.find((row) => row.topic === "Besar")!;
  close(small.contribution.TV, 0);
  close(big.contribution.TV, 100);
  close(small.score, 0);
  close(big.score, 25);
  assert.equal(small.coverage, 1);
  assert.equal(small.metrics.TV!.exposure, 1);
  assert.equal(small.metrics.YouTube, undefined);
  assert.equal(contentClusterTopics(days, "iNews")[0].topic, "Besar");
});

test("TV shares are duration weighted per channel, with equal channel weights in the published combined status", () => {
  const rows = [content("A", "iNews", 60, 10), content("A", "TVOne", 1000, 100), content("A", "KompasTV", 0, 1)];
  const result = contentComparison(rows, "TV", "iNews")[0];
  close(result.own, 6);
  close(result.competitors.TVOne, 10);
  close(result.competitors.KompasTV, 0);
  close(result.gap, (10 + 0) / 2 - 6);
  assert.equal(result.status, "iNews Unggul");
  assert.equal(result.competitorStatuses.TVOne, "Kompetitor Unggul");
  assert.equal(result.competitorStatuses.KompasTV, "iNews Unggul");
});

test("TV decisions use Builder's two-decimal shares and gap at the 0.5-point boundary", () => {
  for (const [share, expected] of [[5.506, "Kompetitor Unggul"], [5.504, "Seimbang"], [5.5, "Seimbang"], [4.494, "iNews Unggul"], [4.496, "Seimbang"], [4.5, "Seimbang"]] as const) {
    const rows = [content("A", "iNews", 5), content("A", "TVOne", share), content("A", "KompasTV", share)];
    const result = contentComparison(rows, "TV", "iNews")[0];
    assert.equal(result.status, expected);
    assert.equal(result.competitorStatuses.TVOne, expected);
    assert.equal(result.competitorStatuses.KompasTV, expected);
  }
});

test("YouTube uses the strongest named competitor, exact 20% boundaries, and distinguishes zero from absence", () => {
  const compare = (own: number, other: number) => contentComparison([
    content("A", "iNews", own, 0, "YouTube"), content("A", "TVOne", other, 0, "YouTube"), content("A", "KompasTV", other / 2, 0, "YouTube"),
  ], "YouTube", "iNews")[0];
  assert.equal(compare(80, 100).status, "Seimbang");
  assert.equal(compare(79.999, 100).status, "Kompetitor Unggul");
  assert.equal(compare(100, 80).status, "Seimbang");
  assert.equal(compare(100, 79.999).status, "iNews Unggul");
  assert.equal(compare(0, 100).gap, 100);
  assert.equal(compare(100, 0).gap, -100);
  assert.equal(compare(0, 0).status, "Seimbang");
  const missing = contentComparison([content("A", "TVOne", 100, 0, "YouTube")], "YouTube", "iNews")[0];
  assert.equal(missing.own, null);
  assert.equal(missing.gap, null);
  assert.equal(missing.status, "Belum Ada Pembanding");
});

const data: TvDataset = { channels: ["INEWS", "TVONE"], monthly: ["09", "10"].map((month) => ({ key: `2026-${month}`, week: 0, first: "", last: "", shares: { INEWS: 8 } })),
  weekly: [{ key: "39", week: 39, first: "2026-09-20", last: "2026-09-26", shares: { INEWS: 7 } }, { key: "40", week: 40, first: "2026-09-27", last: "2026-10-03", shares: { INEWS: 9 } }],
  daily: ["2026-09-27", "2026-09-30", "2026-10-01", "2026-10-03"].map((date) => ({ key: date, week: 40, first: date, last: date, shares: { INEWS: 1 } })),
  paytvDaily: [], paytvWeekly: [], dayparts: { monthly: [], weekly: [], daily: [] }, airings: [], missing: [] };

test("daypart picks the most detailed official sheet while single-week daily trends intersect the selected month", () => {
  const week = tvDaypartPeriods(data, ["2026-09"], ["40"], []);
  assert.equal(week.level, "weekly");
  assert.equal(week.periods[0].shares.INEWS, 9);
  assert.equal(week.trendLevel, "daily");
  assert.deepEqual(week.trendPeriods.map((row) => row.key), ["2026-09-27", "2026-09-30"]);
  const day = tvDaypartPeriods(data, ["2026-09"], ["40"], ["2026-09-30", "2026-10-01"]);
  assert.equal(day.level, "daily");
  assert.deepEqual(day.periods.map((row) => row.key), ["2026-09-30"]);
  assert.equal(tvDaypartPeriods(data, [], [], []).trendPeriods.length, 2);
  assert.equal(tvDaypartPeriods(data, [], ["39", "40"], []).trendLevel, "weekly");
  assert.equal(tvDaypartPeriods(data, ["2026-09", "2026-10"], [], []).trendLevel, "monthly");
});

test("daypart contribution is duration-weighted across all eight dayparts and never uses iNews share as a denominator", () => {
  const names = ["02:00 - 04:29", "04:30 - 09:59", "10:00 - 12:59", "13:00 - 15:59", "16:00 - 17:59", "18:00 - 21:59", "22:00 - 23:59", "24:00 - 25:59"];
  const selected = { ...data, contributions: [{ date: "2026-09-30", week: 40, audience: Object.fromEntries(names.map((name) => [name, 100])) }] };
  const result = tvDaypartContributions(selected, ["2026-09"], ["40"], []);
  const durations = [150, 330, 180, 180, 120, 240, 120, 120];
  names.forEach((name, index) => close(result[name], durations[index] / 1440 * 100));
  close(Object.values(result).reduce((sum, value) => sum + value, 0), 100);
});

test("daypart rank includes extra FTA channels; unavailable competitor data cannot count as an iNews win", () => {
  const selected = { ...data, dayparts: { ...data.dayparts, monthly: [{ key: "2026-09", daypart: "02:00 - 04:29", shares: { INEWS: 3, TVONE: 2, GARUDATV: 4, "SINDONEWS TV": 20 } }] } };
  assert.equal(tvDaypartSummary(selected, "monthly", ["2026-09"], ["02:00 - 04:29"])[0].Rank, 2);
  assert.equal(tvNewsLead({ INEWS: 3, TVONE: 2, KOMPASTV: 1, METRO: null }), false);
  assert.equal(tvNewsLead({ INEWS: 3, TVONE: 2, KOMPASTV: 1, METRO: 0 }), true);
});

test("program averages retain decimal audience counts, skip zero airtime, and SPR rounds seconds to the nearest five minutes", () => {
  const row: TvAiring = { date: "2026-09-01", week: 35, channel: "INEWS", program: "A", start: "02:00", end: "02:01", duration: 1, category: "FRESH", rating: 1, share: 2, audience: 1, paytv: false };
  const result = topTvPrograms([row, { ...row, date: "2026-09-02", audience: 2 }, { ...row, date: "2026-09-03", duration: 0, audience: 999 }])[0];
  assert.equal(result.Audience, 1.5);
  assert.equal(result.Airings, 2);
  assert.equal(sprBlocks([{ ...row, start: "02:02:31" }])[0].start, 1);
  assert.equal(sprBlocks([{ ...row, start: "02:02:29" }])[0].start, 0);
  assert.deepEqual(sprBlocks([{ ...row, start: "02:99" }]), []);
});

test("Pay TV reads its Description column even when a Program column exists", () => {
  const result = buildTvDataset([
    { name: "PERFORMANCE MONTHLY", values: [["Month", "INEWS"], ["SEPTEMBER", 2]] },
    { name: "PERFORMANCE WEEKLY", values: [["Week", "INEWS"], [35, 3]] },
    { name: "Program Detail Paytv", values: [["Date", "Week", "Channel", "Program", "Description", "Dur"], ["01/09/2026", 35, "SINDONEWS TV", "Wrong label", "Official description", 10]] },
  ]);
  assert.equal(result.airings[0].program, "Official description");
  assert.equal(result.airings[0].paytv, true);
});

test("all-invalid Category values leave Fresh/Rerun unavailable instead of claiming zero", () => {
  const row: TvAiring = { date: "2026-09-01", week: 35, channel: "INEWS", program: "A(R)", source: "Program Detail REV2", start: "02:00", duration: 60, category: "#ERROR! (FORMULA PARSE ERROR.)", rating: 1, share: 2, audience: 100, paytv: false };
  const result = tvFreshComposition([row], ["INEWS"])[0];
  assert.equal(result.Fresh, null);
  assert.equal(result.Rerun, null);
  assert.equal(result.FreshHours, null);
  assert.equal(result.RerunHours, null);
  assert.equal(result.Unclassified, 100);
  assert.equal(result.UnclassifiedHours, 1);
  assert.equal(result.UnclassifiedAirings, 1);
});
