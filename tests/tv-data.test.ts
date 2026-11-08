import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTvDataset,
  sprBlocks,
  topTvPrograms,
  matchesTvDate,
  tvFreshComposition,
  tvPeriodPartial,
  tvDaypartSummary,
  tvMean,
  tvPerformanceWeek,
  tvProgramChannels,
  tvProgramAirings,
  tvDaypartContributions,
  resolveTvSheets,
  type TvDataset,
  type TvAiring,
} from "../lib/tv-data";

describe("Data TV spreadsheet", () => {
  test("resolves equivalent Pay TV sheet names without substituting unrelated sheets", () => {
    assert.deepEqual(resolveTvSheets(["Performance Daily Pay TV", "Program_Detail_PayTV", "Performance-Weekly", "PERFORMANCE MONTHLY", "Program Detail REV2"]), [
      { name: "PERFORMANCE MONTHLY", title: "PERFORMANCE MONTHLY" },
      { name: "PERFORMANCE WEEKLY", title: "Performance-Weekly" },
      { name: "PERFORMANCE DAILY PAYTV", title: "Performance Daily Pay TV" },
      { name: "Program Detail REV2", title: "Program Detail REV2" },
      { name: "Program Detail Paytv", title: "Program_Detail_PayTV" },
    ]);
    assert.deepEqual(resolveTvSheets(["Performance Pay TV Archive", "Program Detail FTA"]), []);
    assert.throws(() => resolveTvSheets(["Program Detail Pay TV", "PROGRAM_DETAIL_PAYTV"]), /ambigu/);
    assert.deepEqual(resolveTvSheets(["PERFORMANCE DAILY PAYTV", "Performance Daily Pay TV"]), [
      { name: "PERFORMANCE DAILY PAYTV", title: "PERFORMANCE DAILY PAYTV" },
    ]);
  });
  test("program channel options include the FTA catalog when detail sheets only contain news channels", () => {
    const airing: TvAiring = { date: "2026-01-01", week: 1, channel: "INEWS", program: "A", start: "02:00", duration: 1, category: "FRESH", rating: 1, share: 2, audience: 100, paytv: false };
    assert.deepEqual(tvProgramChannels({ channels: ["INEWS", "TVONE", "KOMPASTV", "METRO", "RCTI", "SCTV", "CNN INDONESIA"], airings: [airing, { ...airing, channel: "GARUDATV" }, { ...airing, channel: "SINDONEWS TV", paytv: true }] }), ["INEWS", "TVONE", "KOMPASTV", "METRO", "RCTI", "SCTV", "CNN INDONESIA", "GARUDATV"]);
    assert.deepEqual(tvProgramChannels({ channels: ["INEWS", "RCTI"], airings: [] }), ["INEWS", "RCTI"]);
  });

  test("separates Share from Reach/YTD and Pay TV, preserves source weeks and normalizes daypart channels", () => {
    const data = buildTvDataset([
      {
        name: "PERFORMANCE MONTHLY",
        values: [
          ["Share FTA"],
          ["MONTH", "INEWS", "TVONE", null, "YEAR", "SINDONEWS TV"],
          [],
          ["JANUARY", 4, 2, null, "JANUARY", 1],
          [2026, 5, 3],
          ["Reach FTA"],
          ["MONTH", "INEWS", "TVONE"],
          ["JANUARY", 999, 888],
        ],
      },
      {
        name: "PERFORMANCE WEEKLY",
        values: [
          ["Share FTA"],
          [
            "Week",
            "INEWS",
            "TVONE",
            null,
            "Week",
            "SINDONEWS TV",
            "IDX CHANNEL",
          ],
          [2601, 3, 2, null, 2601, 5, 0.5],
        ],
      },
      {
        name: "PERFORMANCE DAILY",
        values: [
          ["Date", "Week", "INEWS", "TVONE"],
          ["01/01/2026", 1, 4, 2],
          [46024, 1, 2, 3],
        ],
      },
      {
        name: "PERFORMANCE DAILY PAYTV",
        values: [
          ["Date", "Week", "SINDONEWS TV", "IDX CHANNEL"],
          ["04/01/2026", 1, 1, 0],
        ],
      },
      {
        name: "SHARE DAYPART MONTHLY",
        values: [
          ["Month", "Daypart", "INEWS", "GARUDA TV"],
          ["January", "02:00 - 04:29", 4, 1],
          [],
        ],
      },
      {
        name: "SHARE DAYPART WEEKLY",
        values: [
          ["Week", "Daypart", "INEWS"],
          [1, "02:00 - 04:29", 3],
        ],
      },
      {
        name: "SHARE DAYPART DAILY",
        values: [
          ["Date", "Daypart", "INEWS"],
          ["01/01/2026", "02:00 - 04:29", 5],
        ],
      },
      {
        name: "Program Detail REV2",
        values: [
          [
            "Date",
            "Week",
            "Channel",
            "Program",
            "Start time",
            "TVR",
            "Share",
            "Dur",
            "000s",
            "Category",
          ],
          ["01/01/2026", 1, "INEWS", "A", "02:00", 1, 10, 1, 100, "Fresh"],
          ["02/01/2026", 1, "INEWS", "A", "25:00", 3, 6, 9, 300, "Rerun"],
          ["02/01/2026", 1, "INEWS", "A(R)", "26:00", 2, 4, 2, 50, "Rerun"],
        ],
      },
    ]);
    assert.deepEqual(data.channels, ["INEWS", "TVONE"]);
    assert.equal(data.monthly.length, 1);
    assert.equal(data.monthly[0].shares.INEWS, 4);
    assert.equal(data.monthly[0].first, "2026-01-01");
    assert.equal(data.monthly[0].last, "2026-01-02");
    assert.equal(data.weekly[0].week, 1);
    assert.equal(data.paytvWeekly[0].shares["SINDONEWS TV"], 5);
    assert.equal(data.daily[1].key, "2026-01-02");
    assert.equal(data.paytvDaily[0].shares["IDX CHANNEL"], 0);
    assert.equal(data.dayparts.monthly[0].shares.GARUDATV, 1);
    assert.equal(data.dayparts.weekly[0].key, "1");
    assert.equal(data.dayparts.daily[0].key, "2026-01-01");
    assert.deepEqual(data.missing, [
      "Program Detail Others",
      "Program Detail Paytv",
      "Kontribusi By Daypart",
    ]);
    assert.equal(data.airings[1].start, "25:00");
    const top = topTvPrograms(data.airings);
    assert.equal(top[0].Program, "A");
    assert.equal(top[0].Audience, 200);
    assert.equal(top[0].TVR, 2);
    assert.equal(top[0].Share, 8);
    assert.equal(top[1].Program, "A(R)");
    assert.throws(() => buildTvDataset([]), /Header sheet/);
  });

  test("builds five-minute broadcast blocks, skips zero duration, and resolves overlapping starts", () => {
    const airing = (
      start: string,
      program: string,
      duration = 1,
    ): TvAiring => ({
      date: "2026-01-01",
      week: 1,
      channel: "INEWS",
      start,
      program,
      duration,
      category: "FRESH",
      rating: 1,
      share: 2,
      audience: 100,
      paytv: false,
    });
    const blocks = sprBlocks([
      airing("02:00", "Zero", 0),
      airing("02:00", "Hidden"),
      airing("02:01", "Visible"),
      airing("02:05", "Next"),
      airing("25:55", "Last"),
      airing("26:00", "Outside"),
    ]);
    assert.deepEqual(
      blocks.map((block) => [block.start, block.span, block.airing.program]),
      [
        [0, 1, "Visible"],
        [1, 286, "Next"],
        [287, 1, "Last"],
      ],
    );
    assert.equal(sprBlocks([airing("02:02", "Later"), airing("02:00", "Earlier")])[0].airing.program, "Later");
    assert.equal(sprBlocks([airing("00:00", "Midnight")])[0].start, 264);
  });

  test("Fresh uses only REV2 categories, includes unknown categories in total duration, and averages hours by available days", () => {
    const row = (date: string, duration: number, category: string, source = "Program Detail REV2"): TvAiring => ({
      date, duration, category, source, week: 1, channel: "INEWS", program: "A", start: "02:00", rating: 1, share: 2, audience: 100, paytv: false,
    });
    const rows = [row("2026-01-01", 120, "Fresh"), row("2026-01-02", 60, "FRESH"),
      row("2026-01-01", 60, "Rerun"), row("2026-01-02", 60, ""), row("2026-01-01", 900, "Fresh", "Program Detail Others")];
    const result = tvFreshComposition(rows, ["INEWS"])[0];
    assert.equal(result.Fresh, 60);
    assert.equal(result.Rerun, 20);
    assert.equal(result.FreshHours, 1.5);
    assert.equal(result.RerunHours, 0.5);
    assert.equal(result.Unclassified, 20);
    assert.equal(result.UnclassifiedAirings, 1);
    assert.equal(matchesTvDate("2026-01-02", 1, ["2026-01"], ["1"], ["2026-01-01", "2026-01-03"]), false);
    assert.equal(matchesTvDate("2026-01-03", 1, ["2026-01"], ["1"], ["2026-01-01", "2026-01-03"]), true);
    assert.equal(matchesTvDate("2026-01-03", 2, [], ["1"]), false);
    assert.equal(tvMean([null, undefined, 0, 4]), 2);
    assert.equal(tvMean([null, undefined]), null);
    assert.equal(tvPeriodPartial({ key: "40", week: 40, first: "2026-10-04", last: "2026-10-06", shares: {} }), true);
    assert.equal(tvPeriodPartial({ key: "1", week: 1, first: "2026-01-01", last: "2026-01-10", shares: {} }), false);
    assert.equal(tvPerformanceWeek("2026-01-01"), 1);
    assert.equal(tvPerformanceWeek("2026-01-10"), 1);
    assert.equal(tvPerformanceWeek("2026-01-11"), 2);
    assert.equal(tvPerformanceWeek("2026-10-17"), 41);
    assert.equal(tvPerformanceWeek("2026-10-18"), 42);
  });

  test("program averages skip missing numeric values instead of inventing zero", () => {
    const row: TvAiring = { date: "2026-01-01", duration: 1, category: "FRESH", week: 1, channel: "INEWS", program: "A", start: "02:00", rating: 2, share: 4, audience: 100, paytv: false };
    const result = topTvPrograms([row, { ...row, audience: null, rating: null, share: null }])[0];
    assert.equal(result.Airings, 2);
    assert.equal(result.Audience, 100);
    assert.equal(result.TVR, 2);
    assert.equal(result.Share, 4);
    assert.equal(topTvPrograms([{ ...row, audience: null }])[0].Audience, null);
  });

  test("daypart rank uses all FTA channels and compares with the prior period only for one selection", () => {
    const data: TvDataset = { channels: ["INEWS", "TVONE", "RCTI"], daily: [], weekly: [], paytvDaily: [], paytvWeekly: [], airings: [], missing: [],
      monthly: ["01", "02"].map((month) => ({ key: `2026-${month}`, first: "", last: "", week: 0, shares: {} })),
      dayparts: { daily: [], weekly: [], monthly: [
        { key: "2026-01", daypart: "02:00 - 04:29", shares: { INEWS: 2, TVONE: 1, RCTI: 10 } },
        { key: "2026-02", daypart: "02:00 - 04:29", shares: { INEWS: 3, TVONE: 1, RCTI: 10 } },
      ] },
    };
    assert.deepEqual(tvDaypartSummary(data, "monthly", ["2026-02"], ["02:00 - 04:29"])[0], {
      Daypart: "Early Morning 02:00–04:29", Share: 3, Rank: 2, Change: 1,
    });
    const combined = tvDaypartSummary(data, "monthly", ["2026-01", "2026-02"], ["02:00 - 04:29"])[0];
    assert.equal(combined.Share, 2.5);
    assert.equal(combined.Change, null);
  });

  test("merges duration-weighted program segments only across filler within the same broadcast day and channel", () => {
    const row: TvAiring = { date: "2026-10-01", week: 40, channel: "INEWS", program: "Rakyat Bersuara", start: "21:19", end: "22:19", duration: 60, category: "FRESH", rating: 1, share: 2, audience: 100, paytv: false, level1: "News" };
    const segments = [row,
      { ...row, program: "Promo", level1: "Filler", start: "22:19", end: "22:25", duration: 6, share: 90 },
      { ...row, start: "22:25", end: "22:59", duration: 34, rating: 3, share: 6, audience: 300 },
      { ...row, program: "Other program", start: "23:00", end: "23:30", duration: 30 },
      { ...row, start: "23:30", end: "24:00", duration: 30, audience: 600 },
      { ...row, channel: "TVONE", start: "21:50" },
      { ...row, date: "2026-10-02", start: "21:19" },
      { ...row, program: "Rakyat Bersuara(R)", start: "24:00" },
    ];
    const airings = tvProgramAirings(segments.reverse());
    const merged = airings.find((item) => item.channel === "INEWS" && item.date === row.date && item.start === "21:19")!;
    assert.equal(merged.duration, 94);
    assert.equal(merged.end, "22:59");
    assert.equal(merged.audience, (100 * 60 + 300 * 34) / 94);
    assert.equal(merged.share, (2 * 60 + 6 * 34) / 94);
    const top = topTvPrograms(segments).find((item) => item.Program === row.program && item.Channel === "INEWS")!;
    assert.equal(top.Airings, 3);
    assert.equal(top.Audience, (merged.audience! + 600 + 100) / 3);
    assert.equal(airings.length, 7);
    assert.equal(segments.length, 8);
  });

  test("reads only Total TV contribution and weights every daypart by its full duration across intersecting filters", () => {
    const data = buildTvDataset([
      { name: "PERFORMANCE MONTHLY", values: [["MONTH", "INEWS"], ["JANUARY", 1]] },
      { name: "PERFORMANCE WEEKLY", values: [["Week", "INEWS"], [1, 1]] },
      { name: "Kontribusi By Daypart", values: [
        ["Month", "Week", "Date", "Day of week", "Channel", "02:00 - 04:29", "04:30 - 09:59"],
        ["January", 1, "04/01/2026", "Sunday", "Total TV", 100, 100],
        ["January", 1, "04/01/2026", "Sunday", "INEWS", 99999, 1],
        ["January", 2, "11/01/2026", "Sunday", "Total TV", 300, 100],
      ] },
      { name: "Program Detail REV2", values: [["Date", "Week", "Channel", "Program", "Start time", "End time", "Level 1", "Level 2"],
        ["04/01/2026", 1, "INEWS", "A", 25 / 24, "25:30", "News", "Hard News"]] },
    ]);
    assert.equal(data.contributions?.length, 2);
    const selected = tvDaypartContributions(data, ["2026-01"], ["1"], ["2026-01-04", "2026-01-11"]);
    assert.equal(selected["02:00 - 04:29"], 150 / 480 * 100);
    assert.equal(selected["04:30 - 09:59"], 330 / 480 * 100);
    assert.equal(Object.values(selected).reduce((sum, value) => sum + value, 0), 100);
    const combined = tvDaypartContributions(data, ["2026-01"], [], []);
    assert.equal(combined["02:00 - 04:29"], 400 * 150 / (400 * 150 + 200 * 330) * 100);
    assert.deepEqual(tvDaypartContributions(data, ["2026-02"], [], []), {});
    assert.equal(data.airings[0].start, "25:00");
    assert.equal(data.airings[0].end, "25:30");
    assert.equal(data.airings[0].level1, "News");
    assert.equal(data.airings[0].level2, "Hard News");
  });
});
