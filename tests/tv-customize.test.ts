import { test } from "node:test";
import assert from "node:assert/strict";
import { customizeTvPrograms, filterTvPrograms, tvProgramSummary, tvColumnOrder, tvCalendarMonths, tvCalendarRange, TV_CUSTOM_COLUMNS } from "../lib/tv-customize";
import { type TvAiring } from "../lib/tv-data";

const row: TvAiring = { date: "2026-10-01", week: 40, channel: "INEWS", program: "Buletin", start: "25:00", end: "25:30", duration: 30, category: "FRESH", rating: 1, share: 2, audience: 100, paytv: false, level1: "News", level2: "Hard News" };
test("Customize applies Include OR, Exclude precedence, selected channels and noncontiguous dates", () => {
  const rows = [row, { ...row, program: "BUletin(R)" }, { ...row, program: "Rakyat Bersuara" },
    { ...row, date: "2026-10-02" }, { ...row, channel: "TVONE" }, { ...row, paytv: true }];
  assert.deepEqual(filterTvPrograms(rows, ["INEWS"], [row.date, "2026-10-03"], ["BULETIN", "rakyat"], ["(r)"]).map((item) => item.program), ["Buletin", "Rakyat Bersuara"]);
  assert.equal(filterTvPrograms(rows, [], [], [], []).length, 0);
  assert.equal(filterTvPrograms(rows, ["INEWS"], [], ["  "], []).length, 4);
});
test("Customize averages airings rather than grouped rows and uses first daily broadcast times and modal metadata", () => {
  const rows = [row, { ...row, start: "22:00", end: "23:00", audience: 300, level1: "Other" },
    { ...row, date: "2026-10-02", start: "22:00", end: "23:00", audience: 500 },
    { ...row, date: "2026-11-01", week: 44, audience: null, rating: null, share: 0 }];
  const daily = customizeTvPrograms(rows, "date");
  assert.equal(daily.find((item) => item.Period === row.date)!.Start, "22:00");
  const october = customizeTvPrograms(rows, "month").find((item) => item.Period === "2026-10")!;
  assert.equal(october.Audience, 300);
  assert.equal(october.Airings, 3);
  assert.equal(october.Start, "22:00");
  assert.equal(october.End, "23:00");
  assert.equal(october.Level1, "News");
  assert.equal(customizeTvPrograms(rows, "week").length, 2);
  assert.equal(customizeTvPrograms(rows, "program").length, 1);
  assert.deepEqual(tvProgramSummary(rows), { Airings: 4, Audience: 300, TVR: 1, Share: 1.5 });
  assert.equal(tvProgramSummary([]).Audience, null);
});
test("saved column order rejects unknown and duplicate columns and retains newly available columns", () => {
  const order = tvColumnOrder(["Audience", "Audience", "unknown", null, "Program"]);
  assert.deepEqual(order.slice(0, 2), ["Audience", "Program"]);
  assert.equal(order.length, TV_CUSTOM_COLUMNS.length);
  assert.deepEqual(tvColumnOrder({}), [...TV_CUSTOM_COLUMNS]);
});

test("Customize calendar starts weeks on Sunday, includes leap day, and selects only available dates at both range boundaries", () => {
  const dates = ["2024-02-01", "2024-02-28", "2024-02-29", "2024-03-01", "2024-03-03"];
  const months = tvCalendarMonths(dates);
  assert.deepEqual(months.map((month) => month.key), ["2024-02", "2024-03"]);
  assert.deepEqual(months[0].weeks[0], ["2024-01-28", "2024-01-29", "2024-01-30", "2024-01-31", "2024-02-01", "2024-02-02", "2024-02-03"]);
  assert.ok(months[0].weeks.flat().includes("2024-02-29"));
  assert.ok(months.every((month) => month.weeks.every((week) => week.length === 7 && new Date(`${week[0]}T00:00:00Z`).getUTCDay() === 0)));
  assert.deepEqual(tvCalendarRange(dates, "2024-02-28", "2024-03-03"), ["2024-02-28", "2024-02-29", "2024-03-01", "2024-03-03"]);
  assert.deepEqual(tvCalendarRange(dates, "2024-03-03", "2024-02-28"), []);
  assert.deepEqual(tvCalendarRange(dates, "", "2024-03-03"), []);
});
