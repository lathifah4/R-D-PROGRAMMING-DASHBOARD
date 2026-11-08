"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { Context } from "chartjs-plugin-datalabels";
import { number } from "@/lib/dashboard-data";
import { useDarkTheme } from "@/components/common/theme-toggle";

Chart.register(ChartDataLabels);
const fixed: Record<string, string> = {
  INEWS: "#c41e3a",
  TVONE: "#d97706",
  KOMPASTV: "#0e7490",
  METRO: "#6b7280",
};
const palette = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#ca8a04",
  "#0891b2",
  "#ea580c",
  "#4b5563",
  "#65a30d",
  "#9333ea",
];
export function tvChartColors(channels: string[]) {
  let next = 0;
  return Object.fromEntries(
    channels.map((channel) => [
      channel,
      fixed[channel] ?? palette[next++ % palette.length],
    ]),
  );
}
type Series = {
  label: string;
  values: (number | null)[];
  color?: string;
  hours?: (number | null)[];
};

export function TvChart({
  title,
  labels,
  series,
  kind = "period",
  tips,
  height = 360,
}: {
  title: string;
  labels: string[];
  series: Series[];
  kind?: "period" | "line" | "ranking" | "fresh";
  tips?: string[];
  height?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dark = useDarkTheme();
  const colors = tvChartColors(series.map((item) => item.label));
  const bar = kind !== "line" && (kind !== "period" || labels.length <= 3);
  useEffect(() => {
    if (!canvas.current) return;
    const ranking = kind === "ranking",
      fresh = kind === "fresh";
    const font = getComputedStyle(document.body).fontFamily;
    const theme = getComputedStyle(document.documentElement);
    const ink = theme.getPropertyValue("--builder-ink").trim();
    const inkSecondary = theme.getPropertyValue("--builder-ink-2").trim();
    const grid = theme.getPropertyValue("--builder-grid").trim();
    const surface = theme.getPropertyValue("--builder-surface").trim();
    const red = theme.getPropertyValue("--builder-red-ink").trim();
    const colors = tvChartColors(series.map((item) => item.label));
    const max = Math.max(
      1,
      ...series
        .flatMap((item) => item.values)
        .filter((value): value is number => value !== null),
    );
    const plotWidth = Math.max(
      200,
      canvas.current.parentElement!.clientWidth - 70,
    );
    const categoryPercentage = Math.min(
      0.9,
      (series.length * 56) / (plotWidth / Math.max(1, labels.length)),
    );
    const chart = new Chart(canvas.current, {
      type: bar ? "bar" : "line",
      data: {
        labels,
        datasets: series.map((item, index) => ({
          label: item.label,
          data: item.values,
          backgroundColor: ranking
            ? labels.map((label) =>
                label.endsWith(". INEWS") ? "#c00000" : dark ? "#4b93f5" : "#14284b",
              )
            : (item.color ?? colors[item.label]),
          borderColor: bar ? surface : (item.color ?? colors[item.label]),
          borderRadius: bar ? 3 : 0,
          borderWidth: bar ? 1 : item.label === "INEWS" ? 3 : 2,
          barPercentage: fresh ? 0.62 : ranking ? 0.82 : 1,
          categoryPercentage: ranking ? 0.9 : fresh ? 0.8 : categoryPercentage,
          pointBackgroundColor: item.color ?? colors[item.label],
          pointBorderColor: surface,
          pointBorderWidth: 2,
          pointRadius:
            labels.length > 20 ? 2.5 : item.label === "INEWS" ? 5 : 4,
          tension: 0.25,
          order: fresh ? index : item.label === "INEWS" ? 0 : 1,
          datalabels: {
            display:
              kind === "line"
                ? item.label === "INEWS" || series.length <= 3
                : bar
                  ? true
                  : "auto",
            anchor: fresh ? "center" : "end",
            align: fresh ? "center" : ranking || bar ? "end" : "top",
            offset: fresh ? 0 : ranking ? 4 : 3,
            clamp: !bar,
            color: fresh
              ? index !== 1
                ? "#fff"
                : "#4a2a00"
              : ranking
                ? labels.map((label) =>
                    label.endsWith(". INEWS") ? red : ink,
                  )
                : item.label === "INEWS"
                  ? red
                  : inkSecondary,
            font: {
              family: font,
              weight: "bold",
              size: fresh
                ? 13
                : ranking
                  ? 14
                  : labels.length > 20
                    ? 9
                    : item.label === "INEWS"
                      ? 12
                      : 11,
            },
            textAlign: "center",
            formatter: (value: number | null, context: Context) =>
              value === null
                ? ""
                : fresh
                  ? value < 4
                    ? ""
                    : value < 9
                      ? `${number(value, 2)}%`
                      : [
                          `${number(value, 2)}%`,
                          `${number(item.hours?.[context.dataIndex], 1)} jam`,
                        ]
                  : `${number(value, 2)}${ranking ? "%" : ""}`,
          },
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: ranking ? "y" : "x",
        animation: {
          duration: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 400,
        },
        interaction: { mode: "index", intersect: false },
        layout: {
          padding: ranking ? { right: 70 } : { top: fresh ? 0 : 20, right: 10 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => tips?.[items[0]?.dataIndex] ?? items[0]?.label,
              label: (context) =>
                `${context.dataset.label}: ${number(ranking ? context.parsed.x : context.parsed.y, 2)}%${fresh ? ` · ${number(series[context.datasetIndex].hours?.[context.dataIndex], 1)} jam/hari` : ""}`,
            },
          },
        },
        scales: {
          x: ranking
            ? {
                min: 0,
                suggestedMax: Math.ceil(max * 1.12),
                border: { display: false },
                grid: { color: grid },
                ticks: {
                  color: ink,
                  font: { family: font },
                  callback: (value) => `${value}%`,
                },
              }
            : {
                stacked: fresh,
                grid: { display: false },
                ticks: {
                  color: "#111",
                  font: { family: font, weight: "bold", size: 12 },
                  autoSkip: true,
                  maxRotation: 0,
                  showLabelBackdrop: true,
                  backdropColor: "#ffd84d",
                  backdropPadding: { left: 6, right: 6, top: 3, bottom: 3 },
                },
              },
          y: ranking
            ? {
                grid: { display: false },
                ticks: {
                  color: labels.map((label) =>
                    label.endsWith(". INEWS") ? red : ink,
                  ),
                  font: { family: font, weight: "bold", size: 13 },
                },
              }
            : {
                stacked: fresh,
                min: 0,
                ...(fresh
                  ? { max: 100 }
                  : { suggestedMax: Math.ceil(max * 1.15) }),
                grid: { color: grid },
                border: { display: false },
                ticks: {
                  color: inkSecondary,
                  font: { family: font },
                  ...(fresh ? { stepSize: 25 } : {}),
                  callback: (value) => `${value}%`,
                },
              },
        },
      },
    });
    return () => chart.destroy();
  }, [title, labels, series, kind, tips, height, bar, dark]);

  return (
    <div
      className={`tv-chart tv-chart-${kind}`}
      data-chart-type={bar ? "bar" : "line"}
    >
      {kind !== "ranking" && (
        <div className="tv-chart-legend">
          {series.map((item) => (
            <span key={item.label}>
              <i
                style={{
                  backgroundColor: item.color ?? colors[item.label],
                  height: bar ? 12 : 4,
                }}
              />
              {item.label}
            </span>
          ))}
          {kind === "fresh" && (
            <small>% durasi · jam = rata-rata per hari</small>
          )}
        </div>
      )}
      <div className="tv-chart-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={title}>
          {labels
            .map(
              (label, index) =>
                `${label}: ${series.map((item) => `${item.label} ${item.values[index] === null ? "N/A" : `${number(item.values[index], 2)}%`}`).join(", ")}`,
            )
            .join("; ")}
        </canvas>
      </div>
    </div>
  );
}
