"use client";

import { useState } from "react";
import { monthLabels } from "@/constants/navigation";
import { tvPeriodPartial, type TvDataset } from "@/lib/tv-data";
import { displayDate } from "@/lib/dashboard-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import { TvChannelFilter, TvMultiFilter, monthLabel } from "./tv-filters";
import { TvChart } from "./tv-chart";
import { TvResultPeriod } from "./tv-period";

export function MonthlyPerformance({ data }: { data: TvDataset }) {
  const [months, setMonths] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const periods = data.monthly.filter((row) => months.includes(row.key));
  return (
    <Panel
      title="Monthly Performance"
      subtitle="TV Share % (FTA), National Urban · rata-rata share per bulan"
      filters={
        <div
          className="builder-filter-rail"
          role="region"
          aria-label="Filter Monthly Performance"
        >
          <TvMultiFilter
            label="Bulan"
            unit="bulan"
            options={data.monthly.map((row) => ({
              value: row.key,
              label: `${monthLabel(row.key)}${tvPeriodPartial(row) ? ` (${displayDate(row.first)} – ${displayDate(row.last)})` : ""}`,
              short: monthLabels[Number(row.key.slice(5)) - 1].slice(0, 3),
            }))}
            selected={months}
            onChange={setMonths}
          />
          <TvChannelFilter
            channels={data.channels}
            selected={channels}
            onChange={setChannels}
            limit={10}
          />
        </div>
      }
    >
      {!!periods.length && !!channels.length && (
        <>
          <TvResultPeriod
            section="Monthly"
            period={periods.map((row) => monthLabel(row.key)).join(", ")}
          />
          <TvChart
            title="Monthly Performance: share per bulan"
            labels={periods.map(
              (row) =>
                `${monthLabels[Number(row.key.slice(5)) - 1].slice(0, 3)}${tvPeriodPartial(row) ? "*" : ""}`,
            )}
            tips={periods.map(
              (row) =>
                `${monthLabel(row.key)} · ${displayDate(row.first)} – ${displayDate(row.last)}`,
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
                    `${monthLabel(row.key)} (${displayDate(row.first)} – ${displayDate(row.last)})`,
                )
                .join(" · ")}
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
