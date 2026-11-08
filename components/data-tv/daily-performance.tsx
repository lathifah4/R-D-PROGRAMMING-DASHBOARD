"use client";

import { useState } from "react";
import { matchesTvDate, tvMean, type TvDataset } from "@/lib/tv-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import {
  TvChannelFilter,
  TvPeriodFilters,
  useTvPeriodFilters,
  monthLabel,
} from "./tv-filters";
import { TvChart } from "./tv-chart";
import { TvResultPeriod } from "./tv-period";

export function DailyPerformance({ data }: { data: TvDataset }) {
  const selection = useTvPeriodFilters(data.daily);
  const [channels, setChannels] = useState<string[]>([]);
  const ready = selection.months.length > 0 && channels.length > 0;
  const days = ready
    ? data.daily.filter((row) =>
        matchesTvDate(row.key, row.week, selection.months, [], selection.dates),
      )
    : [];
  const ranked = channels
    .map((channel) => ({
      channel,
      value: tvMean(days.map((day) => day.shares[channel])),
    }))
    .filter((row) => row.value !== null)
    .sort((a, b) => b.value! - a.value!);
  return (
    <Panel
      title="Daily Performance"
      subtitle="Rank harian TV share per channel · PERFORMANCE DAILY"
      filters={
        <div
          className="builder-filter-rail"
          role="region"
          aria-label="Filter Daily Performance"
        >
          <TvPeriodFilters selection={selection} showDates dateRequiresPeriod>
            <TvChannelFilter
              channels={Object.keys(data.daily[0]?.shares ?? {})}
              selected={channels}
              onChange={setChannels}
            />
          </TvPeriodFilters>
        </div>
      }
    >
      {ready &&
        (ranked.length ? (
          <>
            <TvResultPeriod
              section="Daily"
              period={
                selection.dates.length
                  ? selection.dates.join(", ")
                  : selection.months.map(monthLabel).join(", ")
              }
            />
            <div className="tv-result-heading">
              <b>Rank Daily</b>
              <span className="tv-note">
                {selection.dates.length
                  ? `${days.length} tanggal`
                  : `rata-rata ${days.length} hari · ${selection.months.map(monthLabel).join(", ")}`}{" "}
                · TV Share % (FTA)
              </span>
            </div>
            <TvChart
              title="Rank daily TV share"
              kind="ranking"
              height={ranked.length * 42 + 40}
              labels={ranked.map(
                (row, index) => `${index + 1}. ${row.channel}`,
              )}
              series={[
                { label: "Share", values: ranked.map((row) => row.value) },
              ]}
            />
          </>
        ) : (
          <p className="tv-empty">Tidak ada data share untuk pilihan ini.</p>
        ))}
    </Panel>
  );
}
