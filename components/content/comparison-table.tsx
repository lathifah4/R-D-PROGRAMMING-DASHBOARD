"use client";

import { useState, type ReactNode } from "react";
import { contentCompact, contentComparison, YOUTUBE_COMPETITORS, type ContentCluster, type ContentDay } from "@/lib/content-data";
import { number, type DataRow } from "@/lib/dashboard-data";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { inputClass } from "@/components/dashboard/builder-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";

export function ComparisonTable({ days, platform, cluster, onlyTopic, controls }: {
  days: ContentDay[];
  platform: "TV" | "YouTube";
  cluster: ContentCluster;
  onlyTopic?: string;
  controls?: ReactNode;
}) {
  const [filters, setFilters] = useState({
    TV: { search: "", showAll: false },
    YouTube: { search: "", showAll: false },
  });
  const filter = filters[platform];
  const comparisons = contentComparison(days, platform, cluster).filter(
    (row) => !onlyTopic || row.topic === onlyTopic,
  );
  const filtered = comparisons.filter((row) => row.topic.toLocaleLowerCase("id").includes(filter.search.trim().toLocaleLowerCase("id")));
  const shown = onlyTopic ? comparisons : filter.search.trim() || filter.showAll ? filtered : filtered.slice(0, 20);
  const competitors = platform === "TV" ? ["TVOne", "KompasTV"] : YOUTUBE_COMPETITORS[cluster];
  const rows: DataRow[] = shown.map((row, index) => ({
    Rank: index + 1, Topic: row.topic, Own: row.own, ...row.competitors, Status: row.status,
    StatusDetail: Object.entries(row.competitorStatuses).map(([name, status]) => `${name}: ${status}`).join(" · "),
  }));
  const metric = (value: DataRow[string]) => value === null ? "–"
    : platform === "TV" ? `${number(value, 2)}%` : contentCompact(Number(value));
  const columns: Column[] = [
    { key: "Rank", label: "No", numeric: true },
    { key: "Topic", label: "Topik" },
    { key: "Own", label: platform === "TV" ? "Share iNews" : `Views ${cluster}`, numeric: true, render: metric },
    ...competitors.map((name): Column => ({
      key: name,
      label: `${platform === "TV" ? "Share" : "Views"} ${name === "TVOne" && platform === "YouTube" ? "TV One" : name}`,
      numeric: true, render: metric,
    })),
    {
      key: "Status", label: "Status", render: (value, row) => <Badge title={String(row.StatusDetail || "") || undefined}
        className={`font-medium rounded-full ${value === "Kompetitor Unggul" ? "text-white" : value === "Seimbang" || value === "Belum Ada Pembanding" ? "text-white bg-zinc-600" : "text-green-300 bg-green-900"}`}>
        {value}
      </Badge>,
    },
  ];
  return <>
    {!onlyTopic && <div className="builder-filter-rail matrix-filter-rail">
      {controls}
      <input type="search" className={inputClass} aria-label="Cari topik kompetitor" placeholder="Cari topik…" value={filter.search}
        onChange={(event) => setFilters({ ...filters, [platform]: { ...filter, search: event.target.value } })} />
      <Button variant="outline" onClick={() => setFilters({ ...filters, [platform]: { ...filter, showAll: !filter.showAll } })}>
        {filter.showAll ? "Tampilkan ringkas (Top 20)" : `Tampilkan semua (${comparisons.length})`}
      </Button>
      <p className="basis-full text-xs text-zinc-600" role="status">Menampilkan {shown.length} dari {comparisons.length} topik</p>
    </div>}
    <DataTable key={`${platform}-${cluster}-${onlyTopic ?? "all"}`} rows={rows} columns={columns}
      pageSize={Math.max(1, rows.length)} pagination={false} searchable={false} resetOnEmpty={false} />
  </>;
}
