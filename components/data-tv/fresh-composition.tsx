"use client";

import { useMemo } from "react";
import {
  matchesTvDate,
  tvFreshComposition,
  type TvDataset,
} from "@/lib/tv-data";
import { displayDate, number } from "@/lib/dashboard-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import { TvPeriodFilters, useTvPeriodFilters, monthLabel } from "./tv-filters";
import { TvChart } from "./tv-chart";
import { TvResultPeriod } from "./tv-period";

export function FreshComposition({ data }: { data: TvDataset }) {
  const source = useMemo(
    () =>
      data.airings.filter(
        (row) => !row.paytv && row.source === "Program Detail REV2",
      ),
    [data.airings],
  );
  const selection = useTvPeriodFilters(source);
  const channels = [...new Set(source.map((row) => row.channel))];
  const airings = selection.hasPeriod
    ? source.filter((row) =>
        matchesTvDate(row.date, row.week, selection.months, selection.weeks),
      )
    : [];
  const composition = tvFreshComposition(airings, channels);
  const days = [...new Set(airings.map((row) => row.date))].sort();
  return (
    <Panel
      title="Composition Fresh Program"
      subtitle="Porsi durasi tayang Fresh vs Rerun per channel · Program Detail REV2"
      filters={
        <div
          className="builder-filter-rail"
          role="region"
          aria-label="Filter Composition Fresh Program"
        >
          <TvPeriodFilters selection={selection} showWeek />
        </div>
      }
    >
      {selection.hasPeriod &&
        (composition.length ? (
          <div className="tv-fresh-box">
            <TvResultPeriod
              section="Fresh"
              period={[
                selection.months.map(monthLabel).join(", "),
                selection.weeks.map((week) => `W${week}`).join(", "),
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <p className="tv-note">
              Periode:{" "}
              <b>
                {[
                  selection.months.map(monthLabel).join(", "),
                  selection.weeks.map((week) => `W${week}`).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </b>{" "}
              · {displayDate(days[0])} – {displayDate(days.at(-1)!)} (
              {days.length} hari)
            </p>
            {composition.some((row) => row.UnclassifiedAirings > 0) && (
              <p role="status" className="builder-callout">
                {number(composition.reduce((sum, row) => sum + row.UnclassifiedAirings, 0))} dari {number(airings.length)} baris pada periode ini belum memiliki Category Fresh/Rerun yang valid.
                Durasi itu ditampilkan sebagai belum terklasifikasi dan tetap masuk total.
                Fresh/Rerun hanya memakai kategori yang valid; bila seluruh kategori channel tidak valid, nilainya tidak tersedia.
              </p>
            )}
            <TvChart
              title="Komposisi Fresh dan Rerun per channel"
              kind="fresh"
              height={340}
              labels={composition.map((row) => row.Channel)}
              series={[
                {
                  label: "Fresh",
                  color: "#4285f4",
                  values: composition.map((row) => row.Fresh),
                  hours: composition.map((row) => row.FreshHours),
                },
                {
                  label: "Rerun",
                  color: "#f9a05a",
                  values: composition.map((row) => row.Rerun),
                  hours: composition.map((row) => row.RerunHours),
                },
              ]}
            />
          </div>
        ) : (
          <p className="tv-empty">
            Tidak ada hari yang masuk bulan dan week yang dipilih.
          </p>
        ))}
    </Panel>
  );
}
