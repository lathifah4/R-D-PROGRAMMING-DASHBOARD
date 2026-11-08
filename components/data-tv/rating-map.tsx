"use client";

import { useMemo, useState } from "react";
import { displayDate } from "@/lib/dashboard-data";
import { TV_NEWS_CHANNELS, tvProgramChannels, type TvDataset } from "@/lib/tv-data";
import { Panel } from "@/components/dashboard/dashboard-ui";
import {
  TvChannelFilter,
  TvEnterButton,
  TvMultiFilter,
  TvStaleNotice,
  dateOptions,
} from "./tv-filters";
import SprMap from "./spr-map";
import { TvResultPeriod } from "./tv-period";

const news = TV_NEWS_CHANNELS;

export function RatingMap({ data }: { data: TvDataset }) {
  const airings = useMemo(
    () => data.airings.filter((row) => !row.paytv),
    [data.airings],
  );
  const [dates, setDates] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [applied, setApplied] = useState<{
    dates: string[];
    channels: string[];
  } | null>(null);
  const [activeDate, setActiveDate] = useState("");
  const availableDates = [...new Set(airings.map((row) => row.date))];
  const availableChannels = tvProgramChannels(data);
  const canApply = dates.length > 0 && channels.length > 0;
  const date = applied?.dates.includes(activeDate)
    ? activeDate
    : (applied?.dates[0] ?? "");
  const shares = data.daily.find((row) => row.key === date)?.shares ?? {};
  const missingChannels =
    applied?.channels.filter(
      (channel) =>
        !airings.some((row) => row.channel === channel && row.date === date),
    ) ?? [];
  const ordered = [...(applied?.channels ?? [])].sort((a, b) => {
    const aNews = news.indexOf(a),
      bNews = news.indexOf(b);
    const first = aNews < 0 ? 9 : aNews,
      second = bNews < 0 ? 9 : bNews;
    return (
      first - second || (shares[b] ?? -Infinity) - (shares[a] ?? -Infinity)
    );
  });
  return (
    <Panel
      title="Rating Map (SPR)"
      subtitle="Jadwal tayang per 5 menit (02:00–25:59) dengan TVR/Share tiap program · pilih tanggal (maks. 7) dan channel (maks. 10), lalu klik Enter"
      filters={
        <form
          className="builder-filter-rail"
          aria-label="Filter Rating Map"
          onSubmit={(event) => {
            event.preventDefault();
            if (canApply) {
              const sorted = [...dates].sort();
              setApplied({ dates: sorted, channels });
              setActiveDate(sorted[0]);
            }
          }}
        >
          <TvMultiFilter
            label="Tanggal (maks. 7)"
            unit="tanggal"
            options={dateOptions(availableDates)}
            selected={dates}
            onChange={setDates}
            limit={7}
          />
          <TvChannelFilter
            channels={availableChannels}
            selected={channels}
            onChange={setChannels}
            limit={10}
          />
          <TvEnterButton disabled={!canApply} />
        </form>
      }
    >
      {applied && (
        <>
          <TvResultPeriod section="SPR" period={displayDate(date)} />
          <TvStaleNotice
            stale={
              JSON.stringify({ dates: [...dates].sort(), channels }) !==
              JSON.stringify(applied)
            }
            target="Rating Map"
          />
          {applied.dates.length > 1 && (
            <div
              className="tv-spr-tabs"
              role="group"
              aria-label="Pilih tanggal"
            >
              {applied.dates.map((day) => (
                <button
                  type="button"
                  key={day}
                  aria-pressed={date === day}
                  onClick={() => setActiveDate(day)}
                >
                  {displayDate(day)}
                </button>
              ))}
            </div>
          )}
          <h3 className="tv-spr-title">
            Station Program Rating &amp; Share ·{" "}
            {new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
              weekday: "long",
              timeZone: "UTC",
            })}
            , {displayDate(date)}
          </h3>
          <p className="tv-note">
            Week {airings.find((row) => row.date === date)?.week} · National
            Urban, 20+ UM Terrestrial · angka di blok = TVR/Share · angka di
            atas channel = share harian
          </p>
          {missingChannels.length > 0 && (
            <p role="status" className="builder-callout">
              Jadwal program belum tersedia untuk {missingChannels.join(", ")}{" "}
              pada tanggal terpilih.
              {data.missing.includes("Program Detail Others") &&
                " Sheet Program Detail Others belum tersedia di sumber data."}
            </p>
          )}
          <SprMap
            data={data}
            airings={airings}
            columns={ordered.map((channel) => ({ channel, date }))}
          />
        </>
      )}
    </Panel>
  );
}
