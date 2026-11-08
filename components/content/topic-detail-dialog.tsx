"use client";

import { useRef } from "react";
import { CONTENT_PLATFORMS, contentCompact, type ContentCluster, type ContentDay, type ContentPlatform, type ContentTopic } from "@/lib/content-data";
import { displayDate, number } from "@/lib/dashboard-data";
import { EmptyState } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComparisonTable } from "./comparison-table";

function MetricCell({ topic, platform }: { topic: ContentTopic; platform: ContentPlatform }) {
  const metric = topic.metrics[platform];
  if (!metric) return <span className="text-zinc-500" title="Belum ada konten pada periode ini">–</span>;
  return <div className="content-metric rounded px-2 py-1.5 text-right">
    <strong className="font-medium text-zinc-900">{number(topic.contribution[platform] ?? 0, 1)}%</strong>
    <span className="mt-1 block text-4xs text-zinc-700">
      {platform === "TV" ? `${number(metric.duration)} mnt` : `${number(metric.posts)} post`}
    </span>
    {platform !== "TV" && <span className="mt-1 block text-4xs text-zinc-700">
      {contentCompact(metric.views)} · ⌀ {contentCompact(metric.posts ? Math.round(metric.views / metric.posts * 10) / 10 : 0)}/post
    </span>}
  </div>;
}

export function TopicDetailDialog({ days, topics, selectedTopic, onClose, comparisonCluster, from, to }: {
  days: ContentDay[];
  topics: ContentTopic[];
  selectedTopic: string | null;
  onClose: () => void;
  comparisonCluster: ContentCluster;
  from: string;
  to: string;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const selected = topics.find((topic) => topic.topic === selectedTopic);
  return <Dialog open={selectedTopic !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent placement="right" className="topic-drawer" initialFocus={title} showCloseButton={false}>
      <DialogHeader>
        <DialogTitle ref={title} tabIndex={-1}>{selectedTopic}</DialogTitle>
        <DialogDescription>{displayDate(from)} sampai {displayDate(to)} · performa internal lintas platform</DialogDescription>
        <DialogClose render={<Button variant="ghost" size="icon" className="topic-drawer-close" />} aria-label="Tutup detail topik">×</DialogClose>
      </DialogHeader>
      {selected ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CONTENT_PLATFORMS.map((platform) => <div key={platform} className="rounded-lg border border-zinc-200 p-3">
          <h3 className="mb-2 font-medium">{platform}</h3>
          <MetricCell topic={selected} platform={platform} />
          <p className="mt-2 text-3xs text-zinc-600">
            {selected.metrics[platform] ? platform === "TV"
              ? `${number(selected.metrics.TV!.posts)} baris · Share tertimbang ${number(selected.metrics.TV!.duration ? selected.metrics.TV!.exposure / selected.metrics.TV!.duration : 0, 2)}%`
              : `${number(selected.metrics[platform]!.likes)} likes · ${number(selected.metrics[platform]!.comments)} komentar · ${number(selected.metrics[platform]!.shares)} share`
              : "Belum ada konten"}
          </p>
        </div>)}
      </div> : <EmptyState reset={false} />}
      <h3 className="mt-3 font-semibold">TV vs kompetitor</h3>
      <ComparisonTable days={days} platform="TV" cluster="iNews" onlyTopic={selectedTopic ?? ""} />
      <h3 className="mt-3 font-semibold">YouTube vs kompetitor · {comparisonCluster}</h3>
      <ComparisonTable days={days} platform="YouTube" cluster={comparisonCluster} onlyTopic={selectedTopic ?? ""} />
      <DialogClose render={<Button variant="outline" />}>Tutup</DialogClose>
    </DialogContent>
  </Dialog>;
}
