"use client";

import { useState } from "react";
import { monthLabels } from "@/constants/navigation";
import { displayDate, number } from "@/lib/dashboard-data";
import {
  tvMean,
  tvDaypartSummary,
  tvDaypartContributions,
  tvDaypartChannels,
  tvDaypartPeriods,
  tvNewsLead,
  TV_DAYPART_LABELS,
  type TvDataset,
} from "@/lib/tv-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import {
  TvChannelFilter,
  TvMultiFilter,
  TvPeriodFilters,
  useTvPeriodFilters,
  monthLabel,
} from "./tv-filters";
import { TvChart } from "./tv-chart";
import { TvResultPeriod } from "./tv-period";

const daypartName = (name: string) =>
  (TV_DAYPART_LABELS[name] ?? name).replace(/ \d{2}:\d{2}.*$/, "");
type ShareRow = {
  label: string;
  detail?: string;
  shares: Record<string, number | null>;
  contribution?: number;
};

function DaypartTable({
  rows,
  channels,
  footer,
  firstHeading,
  contributions = false,
}: {
  rows: ShareRow[];
  channels: string[];
  footer: ShareRow;
  firstHeading: string;
  contributions?: boolean;
}) {
  return (
    <div
      className="tv-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={`Tabel ${firstHeading}`}
    >
      <table className="tv-table tv-daypart-table">
        <thead>
          <tr>
            <th scope="col">{firstHeading}</th>
            {contributions && <th scope="col" className="tv-contribution">Kontribusi %</th>}
            {channels.map((channel) => (
              <th scope="col" key={channel}>
                {channel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const values = channels
              .map((channel) => row.shares[channel])
              .filter((value): value is number => typeof value === "number");
            const low = Math.min(...values),
              high = Math.max(...values);
            return (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  {row.detail && <small>{row.detail}</small>}
                </th>
                {contributions && <td className="tv-contribution">{row.contribution == null ? "–" : number(row.contribution, 2)}</td>}
                {channels.map((channel) => {
                  const value = row.shares[channel];
                  const best =
                    value != null && channels.length > 1 && value === high;
                  const intensity =
                    value == null
                      ? 0
                      : high > low
                        ? (value - low) / (high - low)
                        : 1;
                  return (
                    <td
                      key={channel}
                      className={`${best ? "is-best" : ""} ${channels.length > 1 && channel === "INEWS" ? "is-inews" : ""}`}
                      style={
                        value == null
                          ? undefined
                          : {
                              backgroundColor: `rgba(31,95,168,${0.06 + intensity * 0.42})`,
                            }
                      }
                      aria-label={`${row.label}, ${channel}: ${value == null ? "N/A" : `${number(value, 2)}%`}${best ? ", tertinggi" : ""}`}
                    >
                      {value == null ? "–" : number(value, 2)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{footer.label}</th>
            {contributions && <td className="tv-contribution">{footer.contribution == null ? "–" : number(footer.contribution, 2)}</td>}
            {channels.map((channel) => (
              <td key={channel}>
                {footer.shares[channel] == null
                  ? "–"
                  : number(footer.shares[channel], 2)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function OverviewSummary({
  data,
  level,
  keys,
  names,
  channels,
}: {
  data: TvDataset;
  level: "monthly" | "weekly" | "daily";
  keys: string[];
  names: string[];
  channels: string[];
}) {
  const summary = tvDaypartSummary(data, level, keys, names).filter(
    (row) => row.Share !== null,
  );
  if (!summary.length) return null;
  const sorted = [...summary].sort((a, b) => b.Share! - a.Share!);
  const total = tvMean(
    data[level]
      .filter((row) => keys.includes(row.key))
      .map((row) => row.shares.INEWS),
  );
  const parts = data.dayparts[level].filter((row) => keys.includes(row.key));
  const newsLeads = names.filter((name) => {
    const rows = parts.filter((row) => row.daypart === name);
    return tvNewsLead(Object.fromEntries(["INEWS", "TVONE", "KOMPASTV", "METRO"].map((channel) =>
      [channel, tvMean(rows.map((row) => row.shares[channel]))])));
  });
  const winners = names.map((name) => {
    const ranked = channels
      .map((channel) => ({
        channel,
        value: tvMean(
          parts
            .filter((row) => row.daypart === name)
            .map((row) => row.shares[channel]),
        ),
      }))
      .filter((row) => row.value !== null)
      .sort((a, b) => b.value! - a.value!);
    return `${daypartName(name)} ${ranked[0]?.channel ?? "–"}`;
  });
  return (
    <div className="tv-daypart-summary">
      <h3>Ringkasan</h3>
      <ul>
        <li>
          Share iNews satu hari penuh{" "}
          <b>{total == null ? "–" : `${number(total, 2)}%`}</b>; daypart terkuat{" "}
          <b>{sorted[0].Daypart}</b> ({number(sorted[0].Share, 2)}%, rank{" "}
          {sorted[0].Rank} dari {tvDaypartChannels(data).length} FTA), terlemah{" "}
          <b>{sorted.at(-1)!.Daypart}</b> ({number(sorted.at(-1)!.Share, 2)}%).
        </li>
        <li>
          Rank iNews per daypart (di antara {tvDaypartChannels(data).length} channel FTA):{" "}
          {summary
            .map((row) => `${daypartName(row.Daypart)} #${row.Rank}`)
            .join(" · ")}
          .
        </li>
        <li>
          Di antara news channel (iNews, TVONE, KOMPASTV, METRO), iNews unggul
          di{" "}
          <b>
            {newsLeads.length} dari {names.length}
          </b>{" "}
          daypart
          {newsLeads.length > 0 && newsLeads.length < names.length
            ? ` (${newsLeads.map(daypartName).join(", ")})`
            : ""}
          .
        </li>
        {keys.length === 1 && summary.some((row) => row.Change !== null) && (
          <li>
            Perubahan share iNews dibanding periode sebelumnya:{" "}
            {summary
              .map(
                (row) =>
                  `${daypartName(row.Daypart)} ${row.Change == null ? "–" : `${row.Change > 0 ? "+" : ""}${number(row.Change, 2)}`}`,
              )
              .join(" · ")}{" "}
            poin.
          </li>
        )}
        {channels.length > 1 && (
          <li>
            Tertinggi per daypart (channel terpilih): {winners.join(" · ")}.
          </li>
        )}
      </ul>
    </div>
  );
}

function TrendSummary({
  rows,
  name,
  channelCount,
}: {
  rows: ShareRow[];
  name: string;
  channelCount: number;
}) {
  const points = rows.filter((row) => typeof row.shares.INEWS === "number");
  if (!points.length) return null;
  const ranked = [...points].sort((a, b) => b.shares.INEWS! - a.shares.INEWS!);
  const first = points[0],
    last = points.at(-1)!;
  const change = last.shares.INEWS! - first.shares.INEWS!;
  const rank = (row: ShareRow) =>
    1 +
    Object.values(row.shares).filter(
      (value) => value !== null && value > row.shares.INEWS!,
    ).length;
  const comparable = points.filter((row) => ["TVONE", "KOMPASTV", "METRO"].every((channel) => typeof row.shares[channel] === "number"));
  const wins = comparable.filter((row) => tvNewsLead(row.shares)).length;
  return (
    <div className="tv-daypart-summary">
      <h3>Ringkasan · {daypartName(name)}</h3>
      <ul>
        <li>
          Rata-rata share iNews di {daypartName(name)}:{" "}
          <b>{number(tvMean(points.map((row) => row.shares.INEWS)), 2)}%</b> ·
          tertinggi {ranked[0].label} ({number(ranked[0].shares.INEWS, 2)}%),
          terendah {ranked.at(-1)!.label} (
          {number(ranked.at(-1)!.shares.INEWS, 2)}%).
        </li>
        {points.length > 1 && (
          <li>
            Dari {first.label} ke {last.label}:{" "}
            <b className={change >= 0 ? "is-up" : "is-down"}>
              {change >= 0 ? "▲ +" : "▼ "}
              {number(change, 2)}
            </b>{" "}
            poin · rank iNews di antara {channelCount} FTA: #{rank(first)} → #
            {rank(last)}.
          </li>
        )}
        <li>
          iNews unggul atas TVONE, KOMPASTV, METRO di{" "}
          <b>
            {wins} dari {comparable.length}
          </b>{" "}
          periode dengan data lengkap keempat news channel.
        </li>
      </ul>
    </div>
  );
}

export function DaypartPerformance({ data }: { data: TvDataset }) {
  const selection = useTvPeriodFilters(data.daily);
  const [channels, setChannels] = useState<string[]>([]);
  const [chosenDayparts, setDayparts] = useState<string[]>([]);
  const [activeDaypart, setActiveDaypart] = useState("all");
  const { months, weeks, dates } = selection;
  const names = [
    ...new Set(
      Object.values(data.dayparts)
        .flat()
        .map((row) => row.daypart),
    ),
  ];
  const daypartChannels = tvDaypartChannels(data);
  const ready =
    !!channels.length && (selection.hasPeriod || chosenDayparts.length > 0);
  const tabs = [
    ...(!chosenDayparts.length ? ["all"] : []),
    ...(chosenDayparts.length ? chosenDayparts : names),
  ];
  const active = tabs.includes(activeDaypart) ? activeDaypart : tabs[0];
  const { level, periods, trendLevel, trendPeriods } = tvDaypartPeriods(data, months, weeks, dates);
  const keys = periods.map((row) => row.key);
  const parts = data.dayparts[level].filter((row) => keys.includes(row.key));
  const contributions = tvDaypartContributions(data, months, weeks, dates);
  const rows: ShareRow[] = names.map((name) => ({
    label: daypartName(name),
    detail: name,
    contribution: contributions[name],
    shares: Object.fromEntries(
      channels.map((channel) => [
        channel,
        tvMean(
          parts
            .filter((row) => row.daypart === name)
            .map((row) => row.shares[channel]),
        ),
      ]),
    ),
  }));
  const total: ShareRow = {
    label: "Total Day",
    contribution: Object.keys(contributions).length ? Object.values(contributions).reduce((sum, value) => sum + value, 0) : undefined,
    shares: Object.fromEntries(
      channels.map((channel) => [
        channel,
        tvMean(periods.map((row) => row.shares[channel])),
      ]),
    ),
  };
  const trendRows: ShareRow[] = trendPeriods.map((period) => ({
    label:
      trendLevel === "daily"
        ? displayDate(period.key)
        : trendLevel === "weekly"
          ? `Week ${period.week}`
          : monthLabel(period.key),
    shares:
      data.dayparts[trendLevel].find(
        (row) => row.key === period.key && row.daypart === active,
      )?.shares ?? {},
  }));
  const average: ShareRow = {
    label: "Rata-rata",
    shares: Object.fromEntries(
      channels.map((channel) => [
        channel,
        tvMean(trendRows.map((row) => row.shares[channel])),
      ]),
    ),
  };
  const sourceLabel = `SHARE DAYPART ${level.toUpperCase()}`;
  return (
    <Panel
      title="Performance by Daypart"
      subtitle="TV share % per daypart per channel · SHARE DAYPART MONTHLY / WEEKLY / DAILY"
      filters={
        <div
          className="builder-filter-rail"
          role="region"
          aria-label="Filter Performance by Daypart"
        >
          <TvPeriodFilters
            selection={selection}
            showWeek
            showDates
            dateRequiresPeriod
          />
          <TvMultiFilter
            label="Daypart"
            unit="daypart"
            placeholder="Semua daypart"
            options={names.map((name) => ({
              value: name,
              label: `${daypartName(name)} (${name})`,
              short: daypartName(name),
            }))}
            selected={chosenDayparts}
            onChange={(values) => {
              setDayparts(values);
              setActiveDaypart(values[0] ?? "all");
            }}
          />
          <TvChannelFilter
            channels={daypartChannels}
            selected={channels}
            onChange={setChannels}
            searchable
          />
        </div>
      }
    >
      {ready && (
        <>
          <TvResultPeriod
            section="Daypart"
            period={[
              ...months.map(monthLabel),
              ...weeks.map((week) => `W${week}`),
              ...(dates.length ? [`${dates.length} tanggal`] : []),
              ...(chosenDayparts.length ? chosenDayparts.map(daypartName) : []),
            ].join(", ")}
          />
          {tabs.length > 1 && (
            <div
              className="tv-daypart-tabs"
              role="group"
              aria-label="Tampilan Daypart"
            >
              {tabs.map((name) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={active === name}
                  onClick={() => setActiveDaypart(name)}
                >
                  {name === "all" ? "Semua Daypart" : daypartName(name)}
                </button>
              ))}
            </div>
          )}
          {active === "all" ? (
            <>
              <div className="tv-result-heading">
                <b>Share by Daypart</b>
                <span className="tv-note">
                  {sourceLabel} · TV Share % (FTA)
                </span>
              </div>
              <DaypartTable
                rows={rows}
                channels={channels}
                footer={total}
                firstHeading="Daypart"
                contributions
              />
              <p className="tv-note">Kontribusi = Σ(000s Total TV × menit daypart) ÷ Σ(000s Total TV × menit seluruh daypart).
                {Object.keys(contributions).length ? " Data tersedia mulai 4 Jan 2026; hanya tanggal yang memiliki data dihitung." : " Data kontribusi belum tersedia pada periode terpilih."}</p>
              {channels.length <= 10 ? (
                <TvChart
                  title="Share per daypart"
                  kind="line"
                  height={340}
                  labels={names.map(
                    (name) => `${daypartName(name)} · ${name.split(" - ")[0]}`,
                  )}
                  series={channels.map((channel) => ({
                    label: channel,
                    values: rows.map((row) => row.shares[channel] ?? null),
                  }))}
                />
              ) : (
                <p className="tv-note">
                  Grafik tampil bila channel ≤ 10; tabel di atas memuat semua
                  channel terpilih.
                </p>
              )}
              <OverviewSummary
                data={data}
                level={level}
                keys={keys}
                names={names}
                channels={channels}
              />
            </>
          ) : (
            <div className="tv-daypart-trend">
              <h3>
                <span>{daypartName(active)}</span> {active}
              </h3>
              <DaypartTable
                rows={trendRows}
                channels={channels}
                footer={average}
                firstHeading={
                  trendLevel === "daily"
                    ? "Tanggal"
                    : trendLevel === "weekly"
                      ? "Week"
                      : "Bulan"
                }
              />
              {channels.length <= 10 && (
                <TvChart
                  title={`Trend ${daypartName(active)}`}
                  kind="period"
                  height={340}
                  labels={trendPeriods.map((period) =>
                    trendLevel === "daily"
                      ? displayDate(period.key).replace(/ \d{4}$/, "")
                      : trendLevel === "weekly"
                        ? `W${period.week}`
                        : monthLabels[Number(period.key.slice(5)) - 1].slice(
                            0,
                            3,
                          ),
                  )}
                  series={channels.map((channel) => ({
                    label: channel,
                    values: trendRows.map((row) => row.shares[channel] ?? null),
                  }))}
                />
              )}
              <TrendSummary
                rows={trendRows}
                name={active}
                channelCount={daypartChannels.length}
              />
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
