"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetDataTv } from "@/services/api";
import { DatasetStatus, Tabs } from "@/components/dashboard/builder-ui";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Button } from "@/components/ui/button";
import { MonthlyPerformance } from "./monthly-performance";
import { WeeklyPerformance } from "./weekly-performance";
import { DailyPerformance } from "./daily-performance";
import { DaypartPerformance } from "./daypart-performance";
import { FreshComposition } from "./fresh-composition";
import { TopPrograms } from "./top-programs";
import { CustomizePrograms } from "./customize-programs";
import { RatingMap } from "./rating-map";
import { PayTvRatingMap } from "./pay-tv-rating-map";
import { TvPeriodContext } from "./tv-period";
import { displayDate } from "@/lib/dashboard-data";

export function DataTvDashboard({ methodology }: { methodology: ReactNode }) {
  const query = useQuery({
    queryKey: ["data-tv", "methodology-v2"],
    retry: 2,
    queryFn: ({ signal }) => GetDataTv(signal),
  });
  const [tab, setTab] = useState("channel");
  const [customizeReady, setCustomizeReady] = useState(false);
  const [periods, setPeriods] = useState<Record<string, string>>({});
  const reportPeriod = useCallback((section: string, period: string) => {
    setPeriods((current) =>
      current[section] === period ? current : { ...current, [section]: period },
    );
  }, []);
  const period =
    Object.entries(periods)
      .filter(([, value]) => value)
      .map(([section, value]) => `${section}: ${value}`)
      .join(" · ") || "Pilih bulan & channel";
  const { setPeriod } = useDashboard();
  useEffect(() => {
    setPeriod(period);
    return () => setPeriod("");
  }, [setPeriod, period]);
  const data = query.data;
  return (
    <DatasetStatus
      ready={!!data}
      error={query.error}
      pending={query.isFetching}
      retry={() => {
        void query.refetch();
      }}
    >
      <TvPeriodContext value={reportPeriod}>
        <div className="tv-dashboard">
          <Tabs
            label="Bagian Data TV"
            items={[
              { value: "channel", label: "Channel" },
              { value: "program", label: "Program" },
              { value: "customize", label: "Customize" },
            ]}
            value={tab}
            onChange={(value) => { setTab(value); if (value === "customize") setCustomizeReady(true); }}
          />
          <div className="page-heading">
            <div className="section-title">
              <h1>{tab === "channel" ? "Performa TV" : tab === "program" ? "Top 30 Program" : "Customize"}</h1>
              <p>
                {tab === "channel"
                  ? "Share FTA per channel dari RAW INEWS (Nielsen) · pilih bulan lalu channel (maksimal 10) untuk menampilkan grafik"
                  : tab === "program" ? "Diurutkan dari Average 000s · pilih bulan, week, atau tanggal, lalu channel, lalu klik Enter"
                  : "Pilih kata kunci (Include / Exclude), channel, dan tanggal, lalu klik Run · atur kolom & baris lewat Opsi Tabel"}
              </p>
            </div>
            {tab !== "customize" && <Button
              variant="outline"
              disabled={query.isFetching}
              aria-busy={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              Refresh
            </Button>}
          </div>
          {tab !== "customize" && data?.daily.length ? <p className="tv-note">Cakupan sumber Data TV saat ini: {displayDate(data.daily[0].key)} – {displayDate(data.daily.at(-1)!.key)}. Periode yang tampil mengikuti data yang tersedia di spreadsheet.</p> : null}
          {data && (
            <>
              <div hidden={tab !== "channel"}>
                <MonthlyPerformance data={data} />
                <WeeklyPerformance data={data} />
                <DailyPerformance data={data} />
                <DaypartPerformance data={data} />
                <FreshComposition data={data} />
              </div>
              <div hidden={tab !== "program"}>
                <TopPrograms data={data} />
                <RatingMap data={data} />
                <PayTvRatingMap data={data} />
              </div>
              <div hidden={tab !== "customize"}>
                {customizeReady && <CustomizePrograms data={data} />}
              </div>
            </>
          )}
          {methodology}
        </div>
      </TvPeriodContext>
    </DatasetStatus>
  );
}
