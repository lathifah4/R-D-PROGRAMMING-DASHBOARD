"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { monthLabels } from "@/constants/navigation";
import { displayDate } from "@/lib/dashboard-data";
import { TV_NEWS_CHANNELS } from "@/lib/tv-data";
import { Button } from "@/components/ui/button";

export type TvFilterOption = {
  value: string;
  label: string;
  short?: string;
  note?: string;
};
type TvDay = { date?: string; key?: string; week: number };
export const monthLabel = (key: string) =>
  `${monthLabels[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
export const dateOptions = (dates: string[]): TvFilterOption[] =>
  [...dates]
    .sort()
    .reverse()
    .map((date) => ({
      value: date,
      label: displayDate(date),
      short: displayDate(date).replace(/ \d{4}$/, ""),
      note: new Date(`${date}T00:00:00Z`).toLocaleDateString("id-ID", {
        weekday: "short",
        timeZone: "UTC",
      }),
    }));

export function TvMultiFilter({
  label,
  unit,
  options,
  selected,
  onChange,
  limit,
  placeholder = `Pilih ${unit}`,
  preset = false,
  searchable = false,
  disabled = false,
  labelCount = 2,
  single = false,
  selectAll = true,
}: {
  label: string;
  unit: string;
  options: TvFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  limit?: number;
  placeholder?: string;
  preset?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  labelCount?: number;
  single?: boolean;
  selectAll?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("focusin", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("focusin", close);
    };
  }, [open]);
  const chosen = options.filter((option) => selected.includes(option.value));
  const text =
    chosen.length === 0
      ? placeholder
      : chosen.length <= labelCount
        ? chosen.map((option) => option.short ?? option.label).join(", ")
        : `${chosen.length} ${unit} dipilih`;
  const shown = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className="tv-filter">
      <span className="tv-filter-label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className="tv-multi"
        ref={root}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            trigger.current?.focus();
          }
        }}
      >
        <button
          ref={trigger}
          type="button"
          className="tv-multi-trigger"
          aria-labelledby={`${id}-label ${id}-value`}
          aria-expanded={open && !disabled}
          aria-controls={`${id}-options`}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <span
            id={`${id}-value`}
            className={chosen.length ? "" : "is-placeholder"}
          >
            {text}
          </span>
          <span aria-hidden="true">▾</span>
        </button>
        {open && !disabled && (
          <div className="tv-multi-popover" id={`${id}-options`} tabIndex={-1}>
            {single && <p className="tv-multi-limit">Pilih satu {unit}</p>}
            {limit && (
              <p className="tv-multi-limit">
                Pilih maksimal {limit} {unit}
              </p>
            )}
            {!single && (
              <div className="tv-multi-actions">
                {!limit && selectAll && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(options.map((option) => option.value))
                    }
                  >
                    Pilih semua
                  </button>
                )}
                <button type="button" onClick={() => onChange([])}>
                  Hapus pilihan
                </button>
                {preset && (
                  <button
                    type="button"
                    className="tv-news-preset"
                    onClick={() =>
                      onChange(
                        options
                          .filter((option) =>
                            TV_NEWS_CHANNELS.includes(option.value),
                          )
                          .slice(0, limit)
                          .map((option) => option.value),
                      )
                    }
                  >
                    News Channel
                  </button>
                )}
              </div>
            )}
            {searchable && (
              <input
                type="search"
                className="builder-input tv-multi-search"
                aria-label={`Cari ${unit}`}
                placeholder={`Cari ${unit}…`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
            <div className="tv-multi-options">
              {shown.map((option) => (
                <label key={option.value}>
                  <input
                    type={single ? "radio" : "checkbox"}
                    name={single ? id : undefined}
                    checked={selected.includes(option.value)}
                    disabled={
                      !!limit &&
                      selected.length >= limit &&
                      !selected.includes(option.value)
                    }
                    onChange={() => {
                      if (single) {
                        onChange([option.value]);
                        setOpen(false);
                        return;
                      }
                      onChange(
                        selected.includes(option.value)
                          ? selected.filter((value) => value !== option.value)
                          : [...selected, option.value],
                      );
                    }}
                  />
                  <span>{option.label}</span>
                  {option.note && <small>{option.note}</small>}
                </label>
              ))}
              {!shown.length && (
                <p className="tv-multi-limit">Tidak ada yang cocok</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TvChannelFilter({
  channels,
  selected,
  onChange,
  limit,
  searchable,
}: {
  channels: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  limit?: number;
  searchable?: boolean;
}) {
  return (
    <TvMultiFilter
      label={limit ? `Channel (maks. ${limit})` : "Channel"}
      unit="channel"
      options={channels.map((channel) => ({ value: channel, label: channel }))}
      selected={selected}
      onChange={onChange}
      limit={limit}
      preset
      searchable={searchable}
    />
  );
}

export function useTvPeriodFilters(records: TvDay[]) {
  const days = useMemo(
    () =>
      [
        ...new Map(
          records.map((row) => {
            const date = row.date ?? row.key ?? "";
            return [date, { date, week: row.week }] as const;
          }),
        ).values(),
      ]
        .filter((row) => row.date)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [records],
  );
  const [months, setMonths] = useState<string[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const inMonths = days.filter(
    (day) => !months.length || months.includes(day.date.slice(0, 7)),
  );
  const availableWeeks = [...new Set(inMonths.map((day) => day.week))].sort(
    (a, b) => a - b,
  );
  const availableDates = inMonths
    .filter((day) => !weeks.length || weeks.includes(String(day.week)))
    .map((day) => day.date);
  return {
    months,
    weeks,
    dates,
    hasPeriod: !!(months.length || weeks.length || dates.length),
    monthOptions: [...new Set(days.map((day) => day.date.slice(0, 7)))].map(
      (key) => ({
        value: key,
        label: monthLabel(key),
        short: monthLabels[Number(key.slice(5)) - 1].slice(0, 3),
      }),
    ),
    weekOptions: availableWeeks.map((week) => {
      const group = days.filter((day) => day.week === week);
      return {
        value: String(week),
        label: `Week ${week}`,
        short: `W${week}`,
        note: `${displayDate(group[0].date)} – ${displayDate(group.at(-1)!.date)}`,
      };
    }),
    dateOptions: dateOptions(availableDates),
    changeMonths: (values: string[]) => {
      const nextDays = days.filter(
        (day) => !values.length || values.includes(day.date.slice(0, 7)),
      );
      const nextWeeks = weeks.filter((week) =>
        nextDays.some((day) => String(day.week) === week),
      );
      setMonths(values);
      setWeeks(nextWeeks);
      setDates(
        dates.filter((date) =>
          nextDays.some(
            (day) =>
              day.date === date &&
              (!nextWeeks.length || nextWeeks.includes(String(day.week))),
          ),
        ),
      );
    },
    changeWeeks: (values: string[]) => {
      setWeeks(values);
      setDates(
        dates.filter((date) =>
          inMonths.some(
            (day) =>
              day.date === date &&
              (!values.length || values.includes(String(day.week))),
          ),
        ),
      );
    },
    changeDates: setDates,
  };
}

export function TvPeriodFilters({
  selection,
  showWeek = false,
  showDates = false,
  dateRequiresPeriod = false,
  children,
}: {
  selection: ReturnType<typeof useTvPeriodFilters>;
  showWeek?: boolean;
  showDates?: boolean;
  dateRequiresPeriod?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <TvMultiFilter
        label="Bulan"
        unit="bulan"
        options={selection.monthOptions}
        selected={selection.months}
        onChange={(values) => {
          selection.changeMonths(values);
          if (dateRequiresPeriod && !values.length && !selection.weeks.length)
            selection.changeDates([]);
        }}
      />
      {showWeek && (
        <TvMultiFilter
          label="Week"
          unit="week"
          placeholder={dateRequiresPeriod ? "Semua week" : "Pilih week"}
          options={selection.weekOptions}
          selected={selection.weeks}
          onChange={(values) => {
            selection.changeWeeks(values);
            if (
              dateRequiresPeriod &&
              !values.length &&
              !selection.months.length
            )
              selection.changeDates([]);
          }}
        />
      )}
      {showDates && (
        <TvMultiFilter
          label="Tanggal"
          unit="tanggal"
          placeholder={dateRequiresPeriod ? "Semua tanggal" : "Pilih tanggal"}
          options={selection.dateOptions}
          selected={selection.dates}
          onChange={selection.changeDates}
          disabled={
            dateRequiresPeriod &&
            !selection.months.length &&
            !selection.weeks.length
          }
        />
      )}
      {children}
    </>
  );
}

export function TvEnterButton({ disabled }: { disabled: boolean }) {
  return (
    <Button
      type="submit"
      className="tv-enter"
      disabled={disabled}
      title="Tampilkan data"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M20 5v7a3 3 0 0 1-3 3H6m4-4.5L5.5 15l4.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Enter
    </Button>
  );
}

export function TvStaleNotice({
  stale,
  target,
}: {
  stale: boolean;
  target: string;
}) {
  return stale ? (
    <p role="status" className="tv-stale">
      Filter berubah, klik <b>Enter</b> untuk memperbarui {target}.
    </p>
  ) : null;
}
