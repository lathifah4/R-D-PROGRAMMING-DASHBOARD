"use client";

import {
  ArrowUpRightIcon,
  ChartLineUpIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useEffect, type ReactNode } from "react";
import { channels, channelLabels, type Channel } from "@/constants/navigation";
import {
  average,
  compact,
  displayDate,
  number,
  rowChannel,
  rowDate,
  type DataRow,
} from "@/lib/dashboard-data";
import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  rows,

  refreshing,
  subtitle,
}: {
  title: string;
  rows: DataRow[];
  exportRows?: DataRow[];
  name: string;
  refreshing?: boolean;
  subtitle?: string;
}) {
  const { isFetching, refetch, setPeriod } = useDashboard();
  const pending = refreshing ?? isFetching;
  const dates = rows.map(rowDate).filter(Boolean).sort();
  const period = dates.length
    ? `${displayDate(dates[0])} – ${displayDate(dates[dates.length - 1])}`
    : "Tidak ada data";
  useEffect(() => {
    setPeriod(period);
    return () => setPeriod("");
  }, [period, setPeriod]);
  return (
    <div className="page-heading">
      <div className="section-title">
        <h1>
          {title}
        </h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
     
    </div>
  );
}


export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
  id,
  filters,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  filters?: ReactNode;
}) {
  return (
    <section
      data-slot="panel"
      className={cn(
        "builder-panel",
        className,
      )}
      id={id}
    >
      <div
        data-slot="panel-heading"
        className="mb-6"
      >
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-extrabold">
            {title}
          </h2>
          {subtitle && (
            <p
              data-slot="panel-description"
              className="panel-description"
            >
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {filters}
      {children}
    </section>
  );
}

export function EmptyState({
  text = "Tidak ada data untuk filter ini.",
  reset = true,
}: {
  text?: string;
  reset?: boolean;
}) {
  const { resetFilters } = useDashboard();
  return (
    <div
      data-slot="empty-state"
      className="flex min-h-45 flex-col items-center justify-center gap-2.5 px-5 py-8.75 text-center text-zinc-500"
    >
      <MagnifyingGlassIcon
        size={30}
        className="text-zinc-400"
        aria-hidden="true"
      />
      <h3 className="text-xs font-medium text-zinc-800">
        Data tidak ditemukan
      </h3>
      <p className="max-w-75 text-2xs leading-relaxed">{text}</p>
      {reset && (
        <Button variant="outline" className="mt-1" onClick={resetFilters}>
          Reset filter
        </Button>
      )}
    </div>
  );
}

export function KpiCards({ rows }: { rows: DataRow[] }) {
  const { filters } = useDashboard();
  const selected = filters.channel === "all" ? "INEWS" : filters.channel;
  const data = rows.filter((row) => rowChannel(row) === selected);
  const rank =
    channels
      .filter((channel) => rows.some((row) => rowChannel(row) === channel))
      .sort(
        (a, b) =>
          average(
            rows.filter((row) => rowChannel(row) === b),
            "Share",
          ) -
          average(
            rows.filter((row) => rowChannel(row) === a),
            "Share",
          ),
      )
      .indexOf(selected) + 1;
  const metrics = [
    {
      label: "TV rating",
      key: "TVR",
      suffix: "TVR",
      description: "Rata-rata rating pemirsa",
      value: number(average(data, "TVR"), 2),
    },
    {
      label: "Audience share",
      key: "Share",
      suffix: "%",
      description: "Rata-rata pangsa pemirsa",
      value: number(average(data, "Share"), 2),
    },
    {
      label: "Average audience",
      key: "000s",
      suffix: "000s",
      description: "Rata-rata kolom 000s",
      value: compact(average(data, "000s")),
    },
    {
      label: "Reach audience",
      key: "Reach 000s",
      suffix: "000s",
      description: "Rata-rata kolom Reach 000s",
      value: compact(average(data, "Reach 000s")),
    },
  ];
  return (
    <div className="mb-3.75 grid grid-cols-2 gap-2.5 sm:mb-5.5 sm:gap-3 md:grid-cols-4 lg:gap-4.25">
      {metrics.map((metric, index) => (
        <article
          key={metric.key}
          data-featured={index === 0}
          className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-3.75 data-[featured=true]:border-red-600 data-[featured=true]:bg-red-600 data-[featured=true]:text-white sm:rounded-2xl sm:p-5 md:p-4.25 lg:px-4.75 lg:py-5 xl:px-5.75"
        >
          <div className="flex items-center justify-between gap-1.5 text-3xs leading-normal text-zinc-600 group-data-[featured=true]:text-white sm:text-xs md:text-2xs lg:text-xs">
            <span>{metric.label}</span>
            {index === 0 ? (
              <ChartLineUpIcon size={19} aria-hidden="true" />
            ) : (
              <span className="rounded-sm bg-zinc-100 px-1.5 py-1 text-5xs text-zinc-500 sm:text-3xs">
                {metric.suffix}
              </span>
            )}
          </div>
          <div
            data-slot="kpi-value"
            className="mt-3.75 mb-2.5 text-3xl leading-display font-medium tracking-tighter tabular-nums sm:mb-3 md:text-kpi"
          >
            {data.some(
              (row) =>
                row[metric.key] !== null && row[metric.key] !== undefined,
            )
              ? metric.value
              : "—"}
            {index === 1 && (
              <span className="ml-0.75 text-lg font-normal text-zinc-500">
                %
              </span>
            )}
          </div>
          <div className="flex min-h-6.5 items-center justify-between gap-1.25 text-4xs text-zinc-500 group-data-[featured=true]:text-white sm:min-h-0 sm:text-3xs md:text-4xs lg:text-3xs">
            <span>{metric.description}</span>
            {index === 0 && data.length > 0 && filters.channel === "all" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-white/15 px-1.5 py-0.75 text-3xs">
                #{rank} <ArrowUpRightIcon size={11} aria-hidden="true" />
              </span>
            )}
          </div>
          <div className="mt-2 border-t border-zinc-100 pt-2.5 text-3xs font-semibold text-zinc-700 group-data-[featured=true]:border-white/25 group-data-[featured=true]:text-white sm:mt-3.5">
            {channelLabels[selected]}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ChannelPill({ channel }: { channel: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.25 text-3xs whitespace-nowrap",
        channel === "INEWS" && "text-red-700",
      )}
    >
      <span
        className={cn(
          "size-1.25 rounded-full",
          channel === "INEWS" ? "bg-red-600" : "bg-zinc-400",
        )}
      />
      {channelLabels[channel as Channel] ?? channel}
    </span>
  );
}

export function MetricNote({ children }: { children: ReactNode }) {
  return (
    <p
      data-slot="metric-note"
      className="metric-note"
    >
      {children}
    </p>
  );
}
