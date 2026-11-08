"use client";

import { CONTENT_COLORS, contentHeatColor, type ContentPlatform, type ContentTopic } from "@/lib/content-data";
import { number, type DataRow } from "@/lib/dashboard-data";
import { DataTable, type Column } from "@/components/dashboard/data-table";

export default function TableMatrixPlatform({ topics, platforms, onTopic, tableKey, scaleTopics = topics }: {
  topics: ContentTopic[];
  platforms: ContentPlatform[];
  onTopic: (topic: string) => void;
  tableKey: string;
  scaleTopics?: ContentTopic[];
}) {
  const maximum = Object.fromEntries(platforms.map((platform) => [platform,
    Math.max(0, ...scaleTopics.map((topic) => topic.contribution[platform] ?? 0)),
  ]));
  const rows: DataRow[] = topics.map((topic, index) => ({
    Rank: index + 1, Topic: topic.topic, Score: topic.score, Tier: topic.tier,
    ...Object.fromEntries(platforms.map((platform) => [platform, topic.contribution[platform] ?? null])),
  }));
  const columns: Column[] = [
    { key: "Rank", label: "No", numeric: true },
    { key: "Topic", label: "Topik", render: (value) => <button
      className="min-h-11 min-w-36 text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-red-600"
      onClick={() => onTopic(String(value))}>{value}</button> },
    { key: "Tier", label: "Tier", render: (value) => <span className="topic-tier " data-tier={String(value)}>{value}</span> },
    ...platforms.map((platform): Column => ({
      key: platform, label: platform, numeric: true,
      header: <><span className="matrix-dot" style={{ backgroundColor: CONTENT_COLORS[platform] }} aria-hidden="true" />{platform}</>,
      cellStyle: (value) => typeof value === "number" ? { backgroundColor: contentHeatColor(platform, value, maximum[platform]),  } : undefined,
      render: (value) => <strong className="matrix-contribution  ">{value === null ? "–" : `${number(value, 1)}%`}</strong>,
    })),
  ];
  if (platforms.length > 1) columns.push({ key: "Score", label: "Skor Gabungan", numeric: true, render: (value) => number(value, 1) });
  return <DataTable key={tableKey} rows={rows} columns={columns} pageSize={Math.max(1, rows.length)}
    pagination={false} searchable={false} resetOnEmpty={false} />;
}
