"use client";

import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react";
import {
  channelLabels,
  channels,
  monthLabels,
  months,
} from "@/constants/navigation";
import { usePathname } from "next/navigation";
import { ecosystemData } from "@/constants/ecosystem";
import { DEFAULT_FILTERS, rowMonth, rowWeek } from "@/lib/dashboard-data";
import { useDashboard } from "./dashboard-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const channelItems = [
  { value: "all", label: "Semua channel" },
  ...channels.map((channel) => ({
    value: channel,
    label: channelLabels[channel],
  })),
];
const yearItems = ["2026", "2025"].map((year) => ({
  value: year,
  label: year,
}));
const monthItems = [
  { value: "all", label: "Semua bulan" },
  ...months.map((month, index) => ({
    value: month,
    label: monthLabels[index],
  })),
];

export function FiltersBar() {
  const { filters, updateFilter, resetFilters, sheets } = useDashboard();
  const pathname = usePathname();
  const weeks = [
    ...new Set(
      [
        ...Object.values(sheets).flatMap((rows) => rows ?? []),
        ...(pathname === "/ecosystem" ? ecosystemData : []),
      ]
        .filter(
          (row) =>
            filters.month === "all" ||
            rowMonth(row) === filters.month.toLowerCase(),
        )
        .map(rowWeek),
    ),
  ]
    .filter((week) => week >= 1 && week <= 53)
    .sort((a, b) => a - b);
  const changed = Object.entries(filters).some(
    ([key, value]) => value !== DEFAULT_FILTERS[key as keyof typeof filters],
  );
  const weekItems = [
    { value: "all", label: "Semua minggu" },
    ...(filters.week !== "all" && !weeks.includes(Number(filters.week))
      ? [
          {
            value: filters.week,
            label: `Minggu ${filters.week} (tidak ada data)`,
          },
        ]
      : []),
    ...weeks.map((week) => ({ value: String(week), label: `Minggu ${week}` })),
  ];
  return (
    <section
      className="grid grid-cols-2 items-center gap-2 border-b border-zinc-200 pb-4.5 sm:flex sm:flex-wrap md:gap-3 md:pb-5.5"
      aria-label="Filter dashboard"
    >
      <div className="hidden items-center gap-2 pr-2 text-xs text-zinc-500 xl:flex">
        <FunnelSimpleIcon size={18} aria-hidden="true" />
        <span>Filter</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-stretch justify-between gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-2 md:flex-initial md:justify-start md:gap-2.5">
        <Label className="shrink-0 text-zinc-600" htmlFor="filter-channel">
          Channel
        </Label>
        <Select
          items={channelItems}
          value={filters.channel}
          onValueChange={(value) => updateFilter("channel", value ?? "all")}
        >
          <SelectTrigger
            id="filter-channel"
            className="w-full min-w-0 max-w-full text-2xs sm:max-w-32.5 md:w-fit md:max-w-42.5 md:text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {channelItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-stretch justify-between gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-2 md:flex-initial md:justify-start md:gap-2.5">
        <Label className="shrink-0 text-zinc-600" htmlFor="filter-year">
          Tahun
        </Label>
        <Select
          items={yearItems}
          value={filters.year}
          onValueChange={(value) => updateFilter("year", value ?? filters.year)}
        >
          <SelectTrigger
            id="filter-year"
            className="w-full min-w-0 max-w-full text-2xs sm:max-w-32.5 md:w-fit md:max-w-42.5 md:text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {yearItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-stretch justify-between gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-2 md:flex-initial md:justify-start md:gap-2.5">
        <Label className="shrink-0 text-zinc-600" htmlFor="filter-month">
          Bulan
        </Label>
        <Select
          items={monthItems}
          value={filters.month}
          onValueChange={(value) => updateFilter("month", value ?? "all")}
        >
          <SelectTrigger
            id="filter-month"
            className="w-full min-w-0 max-w-full text-2xs sm:max-w-32.5 md:w-fit md:max-w-42.5 md:text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {monthItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-stretch justify-between gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-2 md:flex-initial md:justify-start md:gap-2.5">
        <Label className="shrink-0 text-zinc-600" htmlFor="filter-week">
          Minggu
        </Label>
        <Select
          items={weekItems}
          value={filters.week}
          onValueChange={(value) => updateFilter("week", value ?? "all")}
        >
          <SelectTrigger
            id="filter-week"
            className="w-full min-w-0 max-w-full text-2xs sm:max-w-32.5 md:w-fit md:max-w-42.5 md:text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {weekItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <details className="relative mr-auto md:mr-0">
        <Button
          render={<summary />}
          nativeButton={false}
          variant="outline"
          className="list-none px-2.5 text-2xs sm:text-xs [&::-webkit-details-marker]:hidden"
        >
          <CalendarBlankIcon size={17} aria-hidden="true" />
          {filters.from || filters.to ? "Rentang aktif" : "Rentang tanggal"}
          <CaretDownIcon size={12} aria-hidden="true" />
        </Button>
        <div className="absolute top-12.75 right-auto left-0 z-20 grid w-68.75 gap-3.5 rounded-xl border border-zinc-200 bg-white p-5 shadow-lg sm:right-0 sm:left-auto">
          <Label
            htmlFor="filter-from"
            className="grid gap-1.5 text-xs text-zinc-600"
          >
            Dari tanggal
            <input
              id="filter-from"
              type="date"
              className="w-full rounded-md border border-zinc-300 p-2.5 text-zinc-900"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
          </Label>
          <Label
            htmlFor="filter-to"
            className="grid gap-1.5 text-xs text-zinc-600"
          >
            Sampai tanggal
            <input
              id="filter-to"
              type="date"
              className="w-full rounded-md border border-zinc-300 p-2.5 text-zinc-900"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </Label>
          
        </div>
      </details>
      <Button
        variant="ghost"
        className="ml-auto justify-self-end gap-1.5 px-1.25 py-0 text-xs text-zinc-600 enabled:hover:text-red-600"
        disabled={!changed}
        onClick={resetFilters}
        aria-label="Reset filter"
      >
        <ArrowCounterClockwiseIcon size={17} aria-hidden="true" />
        <span>Reset</span>
      </Button>
    </section>
  );
}
