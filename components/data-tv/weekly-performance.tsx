"use client";

import { useState } from "react";
import { tvPeriodPartial, type TvDataset } from "@/lib/tv-data";
import { displayDate } from "@/lib/dashboard-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import {
  TvChannelFilter,
  TvPeriodFilters,
  useTvPeriodFilters,
} from "./tv-filters";
import { TvChart } from "./tv-chart";
import { TvResultPeriod } from "./tv-period";

export function WeeklyPerformance({ data }: { data: TvDataset }) {
  const selection = useTvPeriodFilters(data.daily);
  const [channels, setChannels] = useState<string[]>([]);
  const periods = data.weekly.filter((row) =>
    selection.weeks.length
      ? selection.weeks.includes(String(row.week))
      : selection.months.some(
          (month) =>
            row.first.slice(0, 7) <= month && row.last.slice(0, 7) >= month,
        ),
  );
  return (
    <Panel
      title="Weekly Performance"
      subtitle="TV Share % (FTA), National Urban · share per week (Minggu–Sabtu)"
      filters={
        <div
          className="builder-filter-rail"
          role="region"
          aria-label="Filter Weekly Performance"
        >
          <TvPeriodFilters selection={selection} showWeek>
            <TvChannelFilter
              channels={data.channels}
              selected={channels}
              onChange={setChannels}
              limit={10}
            />
          </TvPeriodFilters>
        </div>
      }
    >
      {selection.hasPeriod && !!channels.length && !!periods.length && (
        <>
          <TvResultPeriod
            section="Weekly"
            period={periods.map((row) => `W${row.week}`).join(", ")}
          />
          <TvChart
            title="Weekly Performance: share per week"
            labels={periods.map(
              (row) => `W${row.week}${tvPeriodPartial(row) ? "*" : ""}`,
            )}
            tips={periods.map(
              (row) =>
                `Week ${row.week} · ${displayDate(row.first)} – ${displayDate(row.last)}`,
            )}
            series={channels.map((channel) => ({
              label: channel,
              values: periods.map((row) => row.shares[channel] ?? null),
            }))}
          />
          {periods.some(tvPeriodPartial) && (
            <p className="tv-note">
              * periode belum penuh:{" "}
              {periods
                .filter(tvPeriodPartial)
                .map(
                  (row) =>
                    `Week ${row.week} (${displayDate(row.first)} – ${displayDate(row.last)})`,
                )
                .join(" · ")}
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
