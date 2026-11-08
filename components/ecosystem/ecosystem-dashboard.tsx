"use client";

import {
  BroadcastIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  YoutubeLogoIcon,
  GlobeIcon,
  TiktokLogoIcon,
  PlayCircleIcon,
} from "@phosphor-icons/react";
import { channels, channelLabels, months } from "@/constants/navigation";
import { ecosystemData, platforms } from "@/constants/ecosystem";
import {
  average,
  compact,
  matchesFilters,
  rowMonth,
  sum,
} from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { ColumnChart, HorizontalBars } from "@/components/dashboard/charts";
import {
  PageHeading,
  Panel,
} from "@/components/dashboard/dashboard-ui";

const icons = [
  InstagramLogoIcon,
  FacebookLogoIcon,
  YoutubeLogoIcon,
  PlayCircleIcon,
  GlobeIcon,
  TiktokLogoIcon,
];

export function EcosystemDashboard() {
  const { filters, getRows } = useDashboard();
  const rows = ecosystemData.filter((row) => matchesFilters(row, filters));
  const weeklyTotals = [...new Set(rows.map((row) => row.Week))].map((week) =>
    sum(
      rows.filter((row) => row.Week === week),
      "Reach",
    ),
  );
  const total = weeklyTotals.length
    ? weeklyTotals.reduce((a, b) => a + b, 0) / weeklyTotals.length
    : 0;
  const platformData = platforms.map((platform) => ({
    label: platform,
    value: weeklyTotals.length
      ? sum(
        rows.filter((row) => row.Platform === platform),
        "Reach",
      ) / weeklyTotals.length
      : 0,
  }));
  const tv = getRows("TREND", filters);
  const trend = months
    .map((month) => {
      const records = rows.filter(
        (row) => rowMonth(row) === month.toLowerCase(),
      );
      const count = new Set(records.map((row) => row.Week)).size;
      return {
        label: month.slice(0, 3),
        value: count ? sum(records, "Reach") / count : 0,
      };
    })
    .filter((row) => row.value > 0);
  const youtube = channels
    .filter(
      (channel) => filters.channel === "all" || channel === filters.channel,
    )
    .map((channel) => ({
      label: channelLabels[channel],
      value: average(
        rows.filter(
          (row) => row.Channel === channel && row.Platform === "YouTube",
        ),
        "Reach",
      ),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const social = channels
    .filter(
      (channel) => filters.channel === "all" || channel === filters.channel,
    )
    .map((channel) => {
      const records = rows.filter(
        (row) =>
          row.Channel === channel &&
          ["Instagram", "Facebook", "TikTok"].includes(row.Platform),
      );
      const count = new Set(records.map((row) => row.Week)).size;
      return {
        label: channelLabels[channel],
        value: count ? sum(records, "Reach") / count : 0,
      };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const tvBars = [...new Set(tv.map((row) => String(row.Channel)))]
    .map((channel) => ({
      label: channelLabels[channel as keyof typeof channelLabels] ?? channel,
      value: average(
        tv.filter((row) => row.Channel === channel),
        "Reach 000s",
      ),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 9);
  return (
    <>
      <PageHeading title="Ecosystem reach" rows={rows} name="ecosystem" />
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-ecosystem">
        <div className="grid grid-cols-2 items-center rounded-2xl bg-red-600 p-5 text-white sm:p-6 md:block">
          <div className="flex items-center gap-2 text-2xs sm:text-xs">
            <BroadcastIcon size={23} aria-hidden="true" />
            <span>Total platform reach</span>
          </div>
          <strong className="col-start-2 row-span-2 row-start-1 block text-right text-3xl font-medium tracking-tighter sm:text-4xl md:mt-6 md:mb-2.5 md:text-left md:text-5xl">
            {rows.length ? compact(total) : "—"}
          </strong>
          <p className="mt-3 mb-6 text-3xs leading-relaxed sm:text-2xs md:mt-0">
            Rata-rata total reach mingguan lintas platform
          </p>

        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:gap-4">
          {platformData.map((platform, index) => {
            const Icon = icons[index];
            return (
              <article
                className="grid grid-cols-platform items-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 "
                key={platform.label}
              >
                <Icon size={22} className="text-zinc-500" aria-hidden="true" />
                <span className="text-2xs leading-normal sm:text-xs">
                  {platform.label}
                </span>
                <strong className="col-span-full mt-2 text-2xl font-medium tracking-tighter sm:text-3xl">
                  {rows.length ? compact(platform.value) : "—"}
                </strong>
              </article>
            );
          })}
        </div>
      </div>
      <Panel
        title="Trend ecosystem"
      >
        <ColumnChart data={trend} title="Tren jangkauan ekosistem bulanan" />

      </Panel>
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-5 xl:grid-cols-summary">
        <Panel
          title="TV reach"
        >
          <HorizontalBars data={tvBars} />
        </Panel>
        <Panel title="YouTube" >
          <HorizontalBars data={youtube} />
        </Panel>
        <Panel
          title="Social media reach"
        >
          <HorizontalBars data={social} />
        </Panel>
      </div>
    </>
  );
}
