"use client";

import { useMemo, useState } from "react";
import { displayDate } from "@/lib/dashboard-data";
import { type TvDataset } from "@/lib/tv-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import {
  TvEnterButton,
  TvMultiFilter,
  TvStaleNotice,
  useTvPeriodFilters,
} from "./tv-filters";
import SprMap from "./spr-map";
import { TvResultPeriod } from "./tv-period";

export function PayTvRatingMap({ data }: { data: TvDataset }) {
  const airings = useMemo(
    () => data.airings.filter((row) => row.paytv),
    [data.airings],
  );
  const days = useMemo(() => [...data.paytvDaily, ...airings], [data.paytvDaily, airings]);
  const selection = useTvPeriodFilters(days);
  const [channel, setChannel] = useState("");
  const [applied, setApplied] = useState<{
    weeks: string[];
    channel: string;
  } | null>(null);
  const [activeWeek, setActiveWeek] = useState("");
  const channels = [...new Set([...data.paytvDaily.flatMap((row) => Object.keys(row.shares)), ...airings.map((row) => row.channel)])];
  const canApply = selection.weeks.length > 0 && !!channel;
  const week = applied?.weeks.includes(activeWeek)
    ? activeWeek
    : (applied?.weeks.at(-1) ?? "");
  const dates = [
    ...new Set(
      days.filter((row) => row.week === Number(week)).map((row) => "date" in row ? row.date : row.key),
    ),
  ].sort();
  const weeklyShare = data.paytvWeekly.find((row) => row.week === Number(week))
    ?.shares[applied?.channel ?? ""];
  const hasPrograms = airings.some((row) => row.channel === applied?.channel && row.week === Number(week));
  return (
    <Panel
      title="Rating Map (SPR) · Pay TV"
      subtitle="Jadwal tayang per 5 menit (02:00–25:59) dengan TVR/Share tiap program · pilih week (satu week = satu layar, kolom per tanggal) dan satu channel, lalu klik Enter"
      filters={
        <form
          className="builder-filter-rail"
          aria-label="Filter Rating Map Pay TV"
          onSubmit={(event) => {
            event.preventDefault();
            if (canApply) {
              const weeks = [...selection.weeks].sort(
                (a, b) => Number(a) - Number(b),
              );
              setApplied({ weeks, channel });
              setActiveWeek(weeks.at(-1)!);
            }
          }}
        >
          <TvMultiFilter
            label="Week"
            unit="week"
            options={[...selection.weekOptions].reverse()}
            selected={selection.weeks}
            onChange={selection.changeWeeks}
            selectAll={false}
          />
          <TvMultiFilter
            label="Channel (pilih satu)"
            unit="channel"
            options={channels.map((name) => ({ value: name, label: name }))}
            selected={channel ? [channel] : []}
            onChange={(values) => setChannel(values[0] ?? "")}
            single
          />
          <TvEnterButton disabled={!canApply} />
        </form>
      }
    >
      {!days.length && <p className="builder-callout" role="status">Data harian dan jadwal Pay TV belum tersedia di sumber.</p>}
      {!applied && days.length > 0 && (
        <p className="tv-empty">
          Pilih week dan satu channel, lalu klik <b>Enter</b>.
        </p>
      )}
      {applied && (
        <>
          <TvResultPeriod
            section="SPR Pay TV"
            period={`${applied.channel} · W${week}`}
          />
          <TvStaleNotice
            stale={
              JSON.stringify({
                weeks: [...selection.weeks].sort(
                  (a, b) => Number(a) - Number(b),
                ),
                channel,
              }) !== JSON.stringify(applied)
            }
            target="Rating Map"
          />
          {applied.weeks.length > 1 && (
            <div className="tv-spr-tabs" role="group" aria-label="Pilih week">
              {applied.weeks.map((value) => {
                const option = selection.weekOptions.find(
                  (option) => option.value === value,
                );
                return (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={week === value}
                    onClick={() => setActiveWeek(value)}
                  >
                    Week {value} · {option?.note?.replace(/ \d{4}/g, "")}
                  </button>
                );
              })}
            </div>
          )}
          <h3 className="tv-spr-title">
            Station Program Rating &amp; Share · {applied.channel} · Week {week}
          </h3>
          <p className="tv-note">
            {displayDate(dates[0]).replace(/ \d{4}$/, "")} – {displayDate(dates.at(-1)!)} ·{" "}
            {dates.length} hari · angka di blok = TVR/Share (Pay TV) · angka di
            atas tanggal = share harian
            {weeklyShare != null && (
              <>
                {" "}
                · share {applied.channel} week ini:{" "}
                <b>{weeklyShare.toFixed(2)}</b>
              </>
            )}
          </p>
          {!hasPrograms && <p className="builder-callout" role="status">Share Pay TV tersedia. Jadwal dan TVR/Share per program belum tersedia dari sheet Program Detail Paytv untuk pilihan ini.</p>}
          <SprMap
            data={data}
            airings={airings}
            columns={dates.map((date) => ({ channel: applied.channel, date }))}
            paytv
          />
        </>
      )}
    </Panel>
  );
}
