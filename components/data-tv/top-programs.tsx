"use client";

import { useMemo, useState } from "react";
import {
  matchesTvDate,
  topTvPrograms,
  tvProgramChannels,
  type TvDataset,
} from "@/lib/tv-data";
import { displayDate, number } from "@/lib/dashboard-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import { TvResultPeriod } from "./tv-period";
import {
  TvChannelFilter,
  TvEnterButton,
  TvPeriodFilters,
  TvStaleNotice,
  useTvPeriodFilters,
  monthLabel,
} from "./tv-filters";

type Selection = {
  months: string[];
  weeks: string[];
  dates: string[];
  channels: string[];
};

export function TopPrograms({ data }: { data: TvDataset }) {
  const source = useMemo(
    () => data.airings.filter((row) => !row.paytv),
    [data.airings],
  );
  const selection = useTvPeriodFilters(source);
  const [channels, setChannels] = useState<string[]>([]);
  const [applied, setApplied] = useState<Selection | null>(null);
  const current = {
    months: selection.months,
    weeks: selection.weeks,
    dates: selection.dates,
    channels,
  };
  const availableChannels = tvProgramChannels(data);
  const canApply =
    channels.length > 0 &&
    selection.hasPeriod &&
    source.some((row) =>
      matchesTvDate(
        row.date,
        row.week,
        selection.months,
        selection.weeks,
        selection.dates,
      ),
    );
  const airings = useMemo(
    () =>
      applied
        ? source.filter(
            (row) =>
              applied.channels.includes(row.channel) &&
              matchesTvDate(
                row.date,
                row.week,
                applied.months,
                applied.weeks,
                applied.dates,
              ),
          )
        : [],
    [source, applied],
  );
  const programs = useMemo(() => topTvPrograms(airings), [airings]);
  const missingChannels =
    applied?.channels.filter(
      (channel) => !airings.some((row) => row.channel === channel),
    ) ?? [];
  const days = [...new Set(airings.map((row) => row.date))].sort();
  return (
    <Panel
      title="Top 30 Program"
      filters={
        <form
          className="builder-filter-rail"
          aria-label="Filter Top 30 Program"
          onSubmit={(event) => {
            event.preventDefault();
            if (canApply) setApplied(current);
          }}
        >
          <TvPeriodFilters selection={selection} showWeek showDates>
            <TvChannelFilter
              channels={availableChannels}
              selected={channels}
              onChange={setChannels}
              limit={10}
            />
          </TvPeriodFilters>
          <TvEnterButton disabled={!canApply} />
        </form>
      }
    >
      {applied && (
        <>
          <TvResultPeriod
            section="Top 30"
            period={[
              ...applied.months.map(monthLabel),
              ...applied.weeks.map((week) => `W${week}`),
              ...(applied.dates.length
                ? [`${applied.dates.length} tanggal`]
                : []),
            ].join(", ")}
          />
          <TvStaleNotice
            stale={JSON.stringify(current) !== JSON.stringify(applied)}
            target="tabel"
          />
          <p className="tv-note">
            Periode:{" "}
            <b>
              {[
                applied.months.map(monthLabel).join(", "),
                applied.weeks.map((week) => `W${week}`).join(", "),
                applied.dates.length ? `${applied.dates.length} tanggal` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </b>
            {days.length > 0 && (
              <>
                {" "}
                · {displayDate(days[0])} – {displayDate(days.at(-1)!)} (
                {days.length} hari)
              </>
            )}{" "}
            · Channel: {applied.channels.join(", ")}
            {applied.channels.length > 1 &&
              applied.channels.includes("INEWS") && (
                <>
                  {" "}
                  · <mark>kuning</mark> = program iNews
                </>
              )}
          </p>
          {missingChannels.length > 0 && (
            <p role="status" className="builder-callout">
              Data program belum tersedia untuk {missingChannels.join(", ")}{" "}
              pada periode terpilih.
              {data.missing.includes("Program Detail Others") &&
                " Sheet Program Detail Others belum tersedia di sumber data."}
            </p>
          )}
          <div
            className="tv-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabel Top 30 Program"
          >
            <table className="tv-table tv-top-programs">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Nama Program</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Average 000s</th>
                  <th scope="col">Avg TVR</th>
                  <th scope="col">Avg Share</th>
                </tr>
              </thead>
              <tbody>
                {programs.length ? (
                  programs.map((row, index) => (
                    <tr
                      key={`${row.Channel}-${row.Program}`}
                      className={
                        applied.channels.length > 1 && row.Channel === "INEWS"
                          ? "is-highlighted"
                          : ""
                      }
                    >
                      <td>{index + 1}</td>
                      <td>{row.Program}</td>
                      <td>{row.Channel}</td>
                      <td>
                        {row.Audience === null
                          ? "–"
                          : number(row.Audience, 2)}
                      </td>
                      <td>{row.TVR === null ? "–" : number(row.TVR, 2)}</td>
                      <td>{row.Share === null ? "–" : number(row.Share, 2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Tidak ada program</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
