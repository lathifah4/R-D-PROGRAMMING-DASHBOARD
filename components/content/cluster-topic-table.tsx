import { contentCompact, type ContentPlatform, type ContentTopic } from "@/lib/content-data";
import { number, type DataRow } from "@/lib/dashboard-data";
import { DataTable, type Column } from "@/components/dashboard/data-table";

export function ClusterTopicTable({ topics, platforms, platform, onTopic, tableKey }: {
  topics: ContentTopic[];
  platforms: ContentPlatform[];
  platform: ContentPlatform | "all";
  onTopic: (topic: string) => void;
  tableKey: string;
}) {
  const share = (topic: ContentTopic) => topic.metrics.TV?.duration
    ? topic.metrics.TV.exposure / topic.metrics.TV.duration : null;
  const rows: DataRow[] = topics.map((topic, index) => ({
    Rank: index + 1, Topic: topic.topic, Coverage: topic.coverage,
    ...Object.fromEntries(platforms.map((name) => [name, topic.metrics[name]
      ? name === "TV" ? share(topic) : topic.metrics[name]!.views : null])),
    Duration: topic.metrics.TV?.duration ?? null,
    Contribution: platform === "all" ? null : topic.contribution[platform] ?? 0,
    Posts: platform === "all" ? null : topic.metrics[platform]?.posts ?? 0,
    Average: platform === "all" || !topic.metrics[platform]?.posts ? 0
      : topic.metrics[platform]!.views / topic.metrics[platform]!.posts,
  }));
  const lookup = new Map(topics.map((topic) => [topic.topic, topic]));
  const columns: Column[] = [
    { key: "Rank", label: "No", numeric: true },
    { key: "Topic", label: "Topik", render: (value) => <button
      className="min-h-11 min-w-36 text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-red-600"
      onClick={() => onTopic(String(value))}>{value}</button> },
  ];
  if (platform === "all") {
    columns.push({ key: "Coverage", label: "Cakupan", numeric: true, render: (value) => `${value}/${platforms.length}` });
    columns.push(...platforms.map((name): Column => ({
      key: name, label: name, numeric: true,
      render: (value, row) => {
        const metric = lookup.get(String(row.Topic))!.metrics[name];
        if (!metric) return "–";
        return <div className="text-right">
          <strong className="font-medium text-zinc-900">{name === "TV" ? `${number(value, 2)}%` : contentCompact(metric.views)}</strong>
          <span className="mt-1 block text-4xs text-zinc-700">{name === "TV" ? `${number(metric.duration, 2)} mnt`
            : `${metric.posts} ${name === "YouTube" || name === "TikTok" ? "video" : "post"}`}</span>
        </div>;
      },
    })));
  } else if (platform === "TV") {
    columns.push(
      { key: "TV", label: "Rata² Share", numeric: true, render: (value) => `${number(value, 2)}%` },
      { key: "Duration", label: "Durasi", numeric: true, render: (value) => `${number(value)} mnt` },
      { key: "Contribution", label: "Kontribusi", numeric: true, render: (value) => `${number(value, 2)}%` },
    );
  } else {
    columns.push(
      { key: platform, label: "Views", numeric: true, render: (value) => contentCompact(Number(value)) },
      { key: "Posts", label: "Posts", numeric: true, render: (value) => number(value) },
      { key: "Contribution", label: "Kontribusi", numeric: true, render: (value) => `${number(value, 2)}%` },
      { key: "Average", label: "Rata² Views/Post", numeric: true, render: (value) => contentCompact(Number(value)) },
    );
  }
  return <DataTable key={tableKey} rows={rows} columns={columns} pageSize={Math.max(1, topics.length)} pagination={false} searchable={false} resetOnEmpty={false} />;
}
