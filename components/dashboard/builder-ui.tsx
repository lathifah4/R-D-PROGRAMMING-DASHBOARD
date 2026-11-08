"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DatasetStatus({
  ready,
  error,
  pending,
  retry,
  children,
}: {
  ready: boolean;
  error: Error | null;
  pending: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  if (!ready)
    return (
      <div
        role={error ? "alert" : "status"}
        className="dataset-status"
      >
        {error ? (
          <>
            <h1 className="font-medium text-zinc-900">Data gagal dimuat</h1>
            <p className="max-w-lg">{error.message}</p>
            <Button className="min-h-11" onClick={retry} disabled={pending}>
              Coba lagi
            </Button>
          </>
        ) : (
          <>
            <span className="loader" aria-hidden="true" />
            <p>Memuat data dashboard…</p>
          </>
        )}
      </div>
    );
  return (
    <div className="dashboard-dataset">
      {error && (
        <p role="alert" className="my-4 text-xs text-red-700">
          Pembaruan gagal
        </p>
      )}
      {children}
    </div>
  );
}

const summaryAccents: Record<string, string> = {
  brand: "border-t-(--builder-red)",
  TV: "border-t-[#c2650a]",
  YouTube: "border-t-[#cc0000]",
  Instagram: "border-t-[#c13584]",
  TikTok: "border-t-[#0694a2]",
  Facebook: "border-t-[#1877f2]",
  X: "border-t-zinc-600",
  competitor: "border-t-[#d97706]",
};

export function SummaryCards({
  items,
}: {
  items: { label: string; value: ReactNode; note: ReactNode; accent?: string }[];
}) {
  return (
    <div data-slot="summary-cards" className="grid grid-cols-1 gap-3.5 min-[561px]:grid-cols-2 min-[1081px]:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          data-slot="summary-card"
          className={cn("flex min-w-0 flex-col gap-0.5 rounded-md border border-(--builder-line) border-t-4 bg-white px-4 py-3.5", summaryAccents[item.accent ?? "brand"] ?? summaryAccents.brand)}
        >
          <p
            data-slot="summary-label"
            className="text-xs font-bold tracking-[0.08em] text-(--builder-ink-2) uppercase"
          >
            {item.label}
          </p>
          <div data-slot="summary-value" className={cn("font-heading font-bold text-(--builder-ink) tabular-nums wrap-anywhere", typeof item.value === "string" && item.value.length > 14 ? "text-[19px]/[1.25]" : "text-[38px]/[1.05]")}>
            {item.value}
          </div>
          <p
            data-slot="summary-note"
            className="text-2xs/[1.4] text-(--builder-muted)"
          >
            {item.note}
          </p>
        </article>
      ))}
    </div>
  );
}

export function Tabs({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="builder-subtabs" role="group" aria-label={label}>
      {items.map((item) => (
        <Button
          key={item.value}
          className="builder-subtab"
          variant={value === item.value ? "default" : "outline"}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

export const inputClass =
  "builder-input";

export function MultiFilter({
  label,
  options,
  selected,
  onChange,
  limit,
  emptyLabel = "Semua",
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  limit?: number;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  return (
    <details className="multi-filter" onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}>
      <summary
        className={cn(
          inputClass,
          "multi-filter-trigger",
        )}
      >
        <span className="multi-filter-label">{label}</span>

        <span className="multi-filter-selection">
          {selected.length === 1 ? options.find((item) => item.value === selected[0])?.label : selected.length ? `${selected.length} dipilih` : emptyLabel}
        </span>
        <span aria-hidden="true">▾</span>
      </summary>
      <div className="multi-filter-popover">
        <input
          className={cn(inputClass, "w-full")}
          aria-label={`Cari ${label.toLowerCase()}`}
          placeholder="Cari…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="my-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange(options.slice(0, limit).map((item) => item.value))
            }
          >
            {limit ? `Pilih ${Math.min(limit, options.length)}` : "Pilih semua"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange([])}>
            Hapus
          </Button>
        </div>
        {limit && (
          <p className="mb-2 text-3xs text-zinc-600">
            Maksimal {limit} pilihan.
          </p>
        )}
        <div className="max-h-56 overflow-y-auto">
          {options
            .filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase()),
            )
            .map((item) => (
              <label
                key={item.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 text-xs hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-red-600"
                  checked={selected.includes(item.value)}
                  disabled={
                    !!limit &&
                    selected.length >= limit &&
                    !selected.includes(item.value)
                  }
                  onChange={() =>
                    onChange(
                      selected.includes(item.value)
                        ? selected.filter((value) => value !== item.value)
                        : [...selected, item.value],
                    )
                  }
                />
                {item.label}
              </label>
            ))}
        </div>
      </div>
    </details>
  );
}
