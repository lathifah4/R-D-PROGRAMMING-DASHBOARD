"use client";

import { useEffect, useRef, useState } from "react";
import { channels, channelLabels, type Channel } from "@/constants/navigation";
import {
  channelColors,
  compact,
  number,
  type ChartPoint,
} from "@/lib/dashboard-data";
import { EmptyState, MetricNote } from "./dashboard-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LineChart({
  data,
  title,
  unit = "%",
  height = 340,
}: {
  data: ChartPoint[];
  title: string;
  unit?: string;
  height?: number;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const hasData = data.length > 0;
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [hasData]);
  const present = channels.filter((channel) =>
    data.some((point) => typeof point[channel] === "number"),
  );
  const visible = present.filter((channel) => !hidden.includes(channel));
  if (!data.length) return <EmptyState />;
  const left = 47,
    right = 19,
    top = 25,
    bottom = 35;
  const max =
    Math.max(
      0.01,
      ...data.flatMap((point) =>
        visible.map((channel) => Number(point[channel] ?? 0)),
      ),
    ) * 1.18;
  const x = (index: number) =>
    left +
    (data.length === 1
      ? (width - left - right) / 2
      : (index * (width - left - right)) / (data.length - 1));
  const y = (value: number) =>
    top + (1 - value / max) * (height - top - bottom);
  const labelStep = Math.max(
    1,
    Math.ceil(data.length / Math.max(2, Math.floor(width / 48))),
  );
  return (
    <div data-slot="line-chart" className="px-3 pb-3">
      <div className="flex flex-wrap justify-start gap-x-3.5 gap-y-2 px-2.5 pb-1.5 sm:gap-x-3">
        {present.map((channel) => (
          <Button
            variant="ghost"
            size="sm"
            key={channel}
            aria-pressed={!hidden.includes(channel)}
            onClick={() =>
              setHidden((old) =>
                old.includes(channel)
                  ? old.filter((item) => item !== channel)
                  : [...old, channel],
              )
            }
            className={cn(
              "min-h-7 gap-1 text-3xs text-zinc-600 sm:text-4xs",
              hidden.includes(channel) && "line-through",
            )}
          >
            <span
              style={{ background: channelColors[channel] }}
              className="block h-1 w-5 rounded-sm"
            />
            {channelLabels[channel]}
          </Button>
        ))}
      </div>
      <div
        ref={container}
        className="relative min-w-0"
        onMouseLeave={() => setHover(null)}
      >
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          tabIndex={0}
          onBlur={() => setHover(null)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              setHover((index) =>
                Math.max(
                  0,
                  Math.min(
                    data.length - 1,
                    (index ?? -1) + (event.key === "ArrowRight" ? 1 : -1),
                  ),
                ),
              );
            }
          }}
          aria-label={`${title}. ${unit === "%" ? "Satuan persen." : `Satuan ${unit}.`} Gunakan tombol panah untuk membaca titik data dan legenda untuk memilih channel.`}
        >
          <title>{title}</title>
          <desc>
            {data
              .map(
                (point) =>
                  `${point.label}: ${visible.map((channel) => `${channelLabels[channel]} ${number(point[channel], 2)}`).join(", ")}`,
              )
              .join("; ")}
          </desc>
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={y((max * tick) / 4)}
                y2={y((max * tick) / 4)}
                stroke="var(--color-zinc-200)"
                strokeDasharray="3 5"
              />
              <text
                x={left - 12}
                y={y((max * tick) / 4) + 4}
                textAnchor="end"
                className="fill-zinc-500 font-sans text-3xs"
              >
                {max > 1000
                  ? compact((max * tick) / 4)
                  : number((max * tick) / 4, 1)}
              </text>
            </g>
          ))}
          {visible.map((channel) => (
            <g key={channel}>
              <path
                d={data
                  .map((point, index) =>
                    typeof point[channel] !== "number"
                      ? ""
                      : `${index === 0 || typeof data[index - 1][channel] !== "number" ? "M" : "L"} ${x(index)} ${y(Number(point[channel]))}`,
                  )
                  .join(" ")}
                fill="none"
                stroke={channelColors[channel]}
                strokeWidth={channel === "INEWS" ? 3.5 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map(
                (point, index) =>
                  typeof point[channel] === "number" && (
                    <g key={index}>
                      <circle
                        cx={x(index)}
                        cy={y(Number(point[channel]))}
                        r={hover === index ? 6 : channel === "INEWS" ? 5 : 3}
                        fill={channelColors[channel]}
                        stroke={channelColors[channel]}
                        strokeWidth={2}
                        role="img"
                        aria-label={`${point.label}, ${channelLabels[channel]}: ${number(point[channel], 2)} ${unit}`}
                        onMouseEnter={() => setHover(index)}
                      />
                      {data.length <= 31 && width / data.length >= 40 && (channel === "INEWS" || present.length <= 3) && (
                        <text
                          x={x(index)}
                          y={y(Number(point[channel])) - 12}
                          textAnchor="middle"
                          fill={channel === "INEWS" ? "var(--builder-red-ink)" : "var(--builder-ink-2)"}
                          fontSize={12}
                          fontWeight={800}
                        >
                          {number(point[channel], 2)}
                        </text>
                      )}
                    </g>
                  ),
              )}
            </g>
          ))}
          {data.map(
            (point, index) =>
              ((index % labelStep === 0 &&
                index <=
                  data.length - 1 - Math.max(1, Math.ceil(labelStep / 2))) ||
                index === data.length - 1) && (
                <text
                  key={index}
                  x={x(index)}
                  y={height - 9}
                  textAnchor="middle"
                  className="fill-zinc-500 font-sans text-3xs"
                >
                  {point.label}
                </text>
              ),
          )}
          {hover !== null && data[hover] && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={top}
              y2={height - bottom}
              stroke="var(--color-zinc-400)"
              strokeDasharray="3 4"
              pointerEvents="none"
            />
          )}
        </svg>
        {hover !== null && data[hover] && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 right-3 z-2 min-w-40 rounded-lg border border-zinc-200 bg-white p-3 text-3xs shadow-sm"
          >
            <strong className="mb-2 block">{data[hover].label}</strong>
            {visible.map((channel) => (
              <div
                key={channel}
                className="mt-2 flex justify-between gap-5"
              >
                <span>{channelLabels[channel]}</span>
                <b className="font-medium">
                  {typeof data[hover][channel] === "number"
                    ? `${number(data[hover][channel], unit === "%" || unit === "TVR" ? 2 : 0)} ${unit}`
                    : "—"}
                </b>
              </div>
            ))}
          </div>
        )}
      </div>
      {!visible.length && (
        <MetricNote>
          Pilih channel di legenda untuk menampilkan grafik.
        </MetricNote>
      )}
    </div>
  );
}

export type BarItem = {
  label: string;
  value: number;
  secondary?: number;
  caption?: string;
  highlight?: boolean;
};

export function HorizontalBars({
  data,
  unit = "",
  stacked = false,
}: {
  data: BarItem[];
  unit?: string;
  stacked?: boolean;
}) {
  if (!data.length) return <EmptyState />;
  const max = stacked ? 100 : Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="builder-bars">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-2 flex items-start justify-between gap-2.5 text-2xs">
            <span className="min-w-0 wrap-anywhere">{item.label}</span>
            <strong className="text-2xs font-medium whitespace-nowrap">
              {stacked ? number(item.value, 1) : compact(item.value)}
              {unit}
            </strong>
          </div>
          <div
            className="bar-track"
            role="img"
            aria-label={`${item.label}: ${number(item.value, 2)}${unit}${stacked ? ` fresh; ${number(item.secondary, 2)}% rerun` : ""}`}
          >
            <span
              className="bar-value"
              style={{
                width: `${Math.max(0, Math.min(100, (item.value / max) * 100))}%`,
                backgroundColor: stacked || (item.highlight ?? index === 0)
                  ? "var(--builder-red)"
                  : ["#1f5fa8", "#d97706", "#0e7490", "#6b7280"][index % 4],
              }}
            />
            {stacked && (
              <span
                style={{ width: `${item.secondary ?? 0}%` }}
                className="bar-secondary"
              />
            )}
          </div>
          {item.caption && (
            <p className=" text-3xs text-zinc-500">{item.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ColumnChart({
  data,
  title,
}: {
  data: BarItem[];
  title: string;
}) {
  if (!data.length) return <EmptyState />;
  const max = Math.max(1, ...data.map((row) => row.value));
  return (
    <div
      className="relative h-60 pt-5 pr-6 pb-10 pl-12 sm:h-68"
      role="img"
      aria-label={`${title}: ${data.map((row) => `${row.label} ${number(row.value)}`).join(", ")}`}
    >
      <div className="absolute top-2.5 left-6 text-3xs text-zinc-500">
        {compact(max)}
      </div>
      <div className="relative flex h-full items-end gap-5 border-b border-zinc-200 ">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col justify-between *:border-t *:border-zinc-100"
        >
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        {data.map((item, index) => (
          <div
            className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            key={item.label}
          >
            <div
              className={cn(
                "group relative w-full max-w-14.5 rounded-t-sm sm:rounded-t-lg",
                index === data.length - 1 ? "bg-red-600" : "bg-zinc-200",
              )}
              style={{ height: `${Math.max(2, (item.value / max) * 100)}%` }}
              tabIndex={0}
              aria-label={`${item.label}: ${number(item.value)}`}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-sm bg-zinc-900 px-2 py-1 text-3xs whitespace-nowrap text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100">
                {compact(item.value)}
              </span>
            </div>
            <span className="absolute -bottom-6 text-4xs text-zinc-500 sm:text-3xs">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const donutColors = [
  "var(--color-red-600)",
  "var(--color-zinc-800)",
  "var(--color-red-300)",
  "var(--color-zinc-400)",
  "var(--color-red-100)",
  "var(--color-zinc-200)",
  "var(--color-red-800)",
  "var(--color-zinc-500)",
];

export function DonutChart({
  data,
  label = "program",
}: {
  data: BarItem[];
  label?: string;
}) {
  if (!data.length) return <EmptyState />;
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const circumference = 2 * Math.PI * 68;
  return (
    <div>
      <div className="relative mx-auto mb-4 size-44">
        <svg
          className="size-full"
          viewBox="0 0 180 180"
          role="img"
          aria-label={data
            .map(
              (row) =>
                `${row.label}: ${number(total ? (row.value / total) * 100 : 0, 1)}%`,
            )
            .join(", ")}
        >
          <circle
            cx="90"
            cy="90"
            r="68"
            fill="none"
            stroke="var(--color-zinc-100)"
            strokeWidth="20"
          />
          {data.map((item, index) => {
            const offset =
              (data.slice(0, index).reduce((sum, row) => sum + row.value, 0) /
                (total || 1)) *
              circumference;
            const length = (item.value / (total || 1)) * circumference;
            return (
              <circle
                key={item.label}
                cx="90"
                cy="90"
                r="68"
                fill="none"
                stroke={donutColors[index % donutColors.length]}
                strokeWidth="20"
                strokeDasharray={`${Math.max(0, length - 3)} ${circumference}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
              >
                <title>{`${item.label}: ${number(item.value)} (${number((item.value / (total || 1)) * 100, 1)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-2xl font-medium tracking-tighter">
            {number(total)}
          </strong>
          <span className="text-4xs text-zinc-500">{label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 pb-5">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 text-4xs"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: donutColors[index % donutColors.length] }}
            />
            <span>{item.label}</span>
            <strong className="ml-auto text-4xs font-medium">
              {number((item.value / (total || 1)) * 100, 1)}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelRanking({
  rows,
}: {
  rows: { channel: Channel; share: number }[];
}) {
  return (
    <div className="px-3.5 sm:px-5">
      {rows.map((row, index) => (
        <div
          key={row.channel}
          className="flex items-center gap-3 border-b border-zinc-100 py-3.5 sm:py-3"
        >
          <span className="text-4xs text-zinc-500 sm:text-3xs">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "font-semibold",
              row.channel === "INEWS"
                ? "text-sm font-bold tracking-tighter text-red-600 sm:text-base"
                : "text-3xs sm:text-xs",
            )}
          >
            {channelLabels[row.channel]}
          </span>
          <strong className="ml-auto text-xs font-medium sm:text-sm">
            {number(row.share, 2)}
            <span className="ml-0.5 text-3xs text-zinc-500">%</span>
          </strong>
        </div>
      ))}
    </div>
  );
}
