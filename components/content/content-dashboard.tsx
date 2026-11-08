"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetContent } from "@/services/api";
import {
  CONTENT_CLUSTERS,
  CONTENT_COLORS,
  CONTENT_PLATFORMS,
  contentClusterPlatforms,
  contentClusterTopics,
  contentInsights,
  contentTopics,
  type ContentCluster,
  type ContentPlatform,
} from "@/lib/content-data";
import {
  displayDate,
  type DataRow,
} from "@/lib/dashboard-data";
import {
  EmptyState,
  MetricNote,
  PageHeading,
  Panel,
} from "@/components/dashboard/dashboard-ui";
import {
  DatasetStatus,
  SummaryCards,
  inputClass,
} from "@/components/dashboard/builder-ui";
import { Button } from "@/components/ui/button";

import TableMatrixPlatform from "./table-matrix-platform";
import { ClusterTopicTable } from "./cluster-topic-table";
import { ComparisonTable } from "./comparison-table";
import { TopicDetailDialog } from "./topic-detail-dialog";
import { ArrowElbowDownLeftIcon } from "@phosphor-icons/react";

const platformItems = [{ value: "all", label: "Semua", color: "var(--builder-red)" },
...CONTENT_PLATFORMS.map((platform) => ({ value: platform, label: platform, color: CONTENT_COLORS[platform] }))];
const tierItems = [
  { value: "all", label: "Semua", color: "var(--builder-red)" },
  { value: "Panas", label: "Panas", color: "#b0122f" },
  { value: "Tinggi", label: "Tinggi", color: "#6b4a0f" },
  { value: "Pantau", label: "Pantau", color: "var(--builder-muted)" },
];
const clusterItems = CONTENT_CLUSTERS.map((name) => ({ value: name, label: name, color: "var(--builder-red)" }));

function MatrixChips({ label, items, value, onChange }: {
  label: string;
  items: { value: string; label: string; color: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="matrix-chip-group" role="group" aria-label={label}>
    <span className="matrix-filter-label">{label}</span>
    <div className="matrix-chip-options">
      {items.map((item) => <Button key={item.value} variant="outline" className="matrix-chip"
        style={{ "--platform-color": item.color } as CSSProperties}
        aria-pressed={value === item.value} onClick={() => onChange(item.value)}>
        <span className="matrix-dot" aria-hidden="true" />{item.label}
      </Button>)}
    </div>
  </div>;
}
export function ContentDashboard({ methodology }: { methodology: ReactNode }) {
  const query = useQuery({
    queryKey: ["content", "published-methodology-v3"],
    retry: 2,
    queryFn: ({ signal }) => GetContent(signal),
  });
  const [range, setRange] = useState({ from: "", to: "" });
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [platform, setPlatform] = useState("all");
  const [tier, setTier] = useState("all");
  const [topicSearch, setTopicSearch] = useState("");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [cluster, setCluster] = useState<ContentCluster>("iNews");
  const [clusterPlatform, setClusterPlatform] = useState<ContentPlatform | "all">("TV");
  const [clusterSearch, setClusterSearch] = useState("");
  const [showAllClusterTopics, setShowAllClusterTopics] = useState(false);
  const [comparisonPlatform, setComparisonPlatform] = useState<
    "TV" | "YouTube"
  >("TV");
  const [comparisonCluster, setComparisonCluster] =
    useState<ContentCluster>("iNews");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const first = query.data?.days[0]?.date ?? "";
  const last = query.data?.days.at(-1)?.date ?? "";
  const from = range.from || first,
    to = range.to || last;
  const days = useMemo(
    () =>
      (query.data?.days ?? []).filter(
        (row) => row.date >= from && row.date <= to,
      ),
    [query.data, from, to],
  );
  const topics = useMemo(() => contentTopics(days), [days]);
  const clusterPlatforms = useMemo(() => contentClusterPlatforms(days, cluster), [days, cluster]);
  const activeClusterPlatform = clusterPlatform === "all" || clusterPlatforms.includes(clusterPlatform) ? clusterPlatform : clusterPlatforms[0];
  const clusterTopics = useMemo(
    () => contentClusterTopics(days, cluster),
    [days, cluster],
  );
  const visibleTopics = topics.filter(
    (topic) =>
      (tier === "all" || topic.tier === tier) &&
      topic.topic.toLocaleLowerCase("id").includes(topicSearch.trim().toLocaleLowerCase("id")),
  );
  if (platform !== "all")
    visibleTopics.sort(
      (a, b) =>
        (b.contribution[platform as ContentPlatform] ?? -1) -
        (a.contribution[platform as ContentPlatform] ?? -1) || a.order - b.order,
    );
  const matrixTopics = tier === "all" && platform === "all" && !topicSearch.trim() && !showAllTopics
    ? visibleTopics.slice(0, 20) : visibleTopics;
  const rankedClusterTopics = contentClusterTopics(days, cluster, activeClusterPlatform);
  const filteredClusterTopics = rankedClusterTopics.filter((topic) =>
    topic.topic.toLocaleLowerCase("id").includes(clusterSearch.trim().toLocaleLowerCase("id")));
  const topCluster = activeClusterPlatform === "all"
    ? clusterSearch.trim() || showAllClusterTopics ? filteredClusterTopics : filteredClusterTopics.slice(0, 20)
    : rankedClusterTopics.slice(0, 10);
  const gapDates =
    query.data?.sindonewsGaps.filter((date) => date >= from && date <= to) ??
    [];
  const partialSources = query.data?.sources.filter((source) =>
    source.first && source.last && (from < source.first || to > source.last)) ?? [];
  const gapGroups: string[][] = [];
  for (const date of gapDates) {
    const group = gapGroups.at(-1);
    if (group && Date.parse(date) - Date.parse(group.at(-1)!) === 86400000)
      group.push(date);
    else gapGroups.push([date]);
  }
  function preset(count?: number) {
    const start =
      count && last
        ? new Date(
          new Date(`${last}T00:00:00Z`).getTime() - (count - 1) * 86400000,
        )
          .toISOString()
          .slice(0, 10)
        : first;
    const value = { from: start < first ? first : start, to: last };
    setRange(value);
    setDraft(value);
  }
  const exportRows: DataRow[] = topics.map((topic) => ({
    Topic: topic.topic,
    Tier: topic.tier,
    Score: topic.score,
    Coverage: topic.coverage,
    ...Object.fromEntries(
      CONTENT_PLATFORMS.flatMap((platform) => [
        [`${platform} Contribution (%)`, topic.contribution[platform] ?? null],
        [
          `${platform} ${platform === "TV" ? "Duration (min)" : "Views"}`,
          platform === "TV"
            ? (topic.metrics.TV?.duration ?? null)
            : (topic.metrics[platform]?.views ?? null),
        ],
      ]),
    ),
  }));
  return (
    <DatasetStatus
      ready={!!query.data}
      pending={query.isFetching}
      error={query.error}
      retry={() => {
        void query.refetch();
      }}
    >
      <div className="content-dashboard">
        <PageHeading
          title="Performa Topik Lintas Platform"
          rows={days.map((row) => ({ Date: row.date }))}
          exportRows={exportRows}
          name="content"
          refreshing={query.isFetching}
          subtitle="TV (iNews + Sindonews) · YouTube · Instagram · TikTok · Facebook · X · Unit INEWS Media Group"
        />
      <form
        className="builder-filter-rail"
        aria-label="Rentang tanggal berlaku untuk seluruh bagian Content."
        onSubmit={(event) => {
          event.preventDefault();
          setRange({ from: draft.from || first, to: draft.to || last });
        }}
      >
        <label className="grid gap-1.5 text-2xs text-zinc-600">
          Dari
          <input
            className={inputClass}
            type="date"
            disabled={!first}
            min={first}
            max={draft.to || last}
            value={draft.from || from}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1.5 text-2xs text-zinc-600">
          Sampai
          <input
            className={inputClass}
            type="date"
            disabled={!first}
            min={draft.from || first}
            max={last}
            value={draft.to || to}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          />
        </label>
        <Button type="submit" disabled={!first}>
          <ArrowElbowDownLeftIcon />
          Terapkan
        </Button>
        <Button variant="outline" disabled={!first} onClick={() => preset()}>
          Semua data
        </Button>
        <Button variant="outline" disabled={!first} onClick={() => preset(7)}>
          7 hari terakhir
        </Button>
        <Button variant="outline" disabled={!first} onClick={() => preset(30)}>
          30 hari terakhir
        </Button>
        <p className="basis-full font-semibold text-white">
          {from && to
            ? `${displayDate(from)} sampai ${displayDate(to)} · berlaku untuk seluruh bagian Content di bawah ini`
            : "Pilih rentang tanggal untuk menampilkan data."}
        </p>
      </form>
    
      {from && to && (Date.parse(to) - Date.parse(from)) / 86400000 <= 2 && (
        <p role="status" className="builder-callout">
          Rentang maksimal tiga hari dapat membuat ranking lebih dipengaruhi
          satu konten viral.
        </p>
      )}
      {gapDates.length > 0 && (
        <p
          role="status"
          className="builder-callout"
        >
          ⚠️ Rentang ini mencakup {" "}
          {gapGroups
            .map((group) =>
              group.length === 1
                ? displayDate(group[0])
                : `${displayDate(group[0])}–${displayDate(group.at(-1)!)}`,
            )
            .join(", ")}
          - Sindonews TV tidak ada data pada tanggal tsb (gap data, BUKAN performa nol) Angka Sindonews pada rentang ini kemungkinan di bawah performa riil.
        </p>
      )}
      {!days.length ? (
        <EmptyState
          reset={false}
          text={
            query.data?.days.length
              ? "Tidak ada data pada rentang ini. Pilih Semua data untuk mengembalikan periode."
              : "Spreadsheet Content belum memiliki baris data. Lengkapi sumber lalu tekan Refresh."
          }
        />
      ) : (
        <>
          <section aria-labelledby="executive-summary-title" className="mb-5.5 min-w-0 rounded-md border border-(--builder-line) bg-white px-3 py-3.5 min-[561px]:px-4.5 min-[561px]:py-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2.5">
              <h2 id="executive-summary-title" className="font-heading text-2xl/normal font-bold uppercase">Ringkasan Eksekutif</h2>
              <p className="mt-1 text-2xs text-(--builder-muted)">Periode {displayDate(from)} – {displayDate(to)}</p>
            </div>
            <SummaryCards items={contentInsights(days, topics)} />
          </section>
          <Panel
            title="Matrix Topik × Platform"
            subtitle={`Menampilkan ${matrixTopics.length} dari ${visibleTopics.length} topik`}
          >
            <div className="builder-filter-rail matrix-filter-rail" role="region" aria-label="Filter topik">
              <MatrixChips label="Platform" items={platformItems} value={platform} onChange={(value) => { setPlatform(value); setShowAllTopics(false); }} />
              <MatrixChips label="Tier" items={tierItems} value={tier} onChange={(value) => { setTier(value); setShowAllTopics(false); }} />
              <div className="matrix-search-group">
                <input type="search" className={inputClass} aria-label="Cari topik" placeholder="Cari topik…" value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} />
                <Button variant="outline" onClick={() => setShowAllTopics(!showAllTopics)}>
                  {showAllTopics ? "Tampilkan ringkas (Top 20)" : `Tampilkan semua (${topics.length})`}
                </Button>
              </div>
            </div>
            <TableMatrixPlatform
              topics={matrixTopics}
              scaleTopics={topics}
              platforms={
                platform === "all"
                  ? [...CONTENT_PLATFORMS]
                  : [platform as ContentPlatform]
              }
              onTopic={setSelectedTopic}
              tableKey={`${from}-${to}-${platform}-${tier}-${topicSearch}-${showAllTopics}`}
            />
            <div className="matrix-legend" aria-label="Legenda warna platform">
              {CONTENT_PLATFORMS.map((platform) => <span key={platform}><i style={{ backgroundColor: CONTENT_COLORS[platform] }} />{platform}</span>)}
              <span>Warna sel = intensitas kontribusi, skala akar relatif terhadap topik tertinggi tiap platform. “–” = belum ada konten.</span>
            </div>
            <MetricNote>
              TV: Σ(Durasi × Share). Digital: total Views; Facebook dan X
              mengikuti metrik tayangan pada sumber. Penyebut kontribusi hanya
              konten bertopik; Other dan segmen struktural dikecualikan. Topik lengkap enam platform
              diprioritaskan, lalu skor gabungan. Klik nama topik untuk detail.
            </MetricNote>
          </Panel>
          <Panel
            title="Top Topik per Cluster"
            subtitle={activeClusterPlatform === "all" ? `Menampilkan ${topCluster.length} dari ${clusterTopics.length} topik`
              : "10 topik dengan performa tertinggi periode ini, diakumulasi dari kolom Agenda Setting"}
          >
            <div className="cluster-filter-rail" role="region" aria-label="Pilih cluster & platform">
              <MatrixChips label="Cluster" items={clusterItems} value={cluster} onChange={(value) => {
                const next = value as ContentCluster;
                const available = contentClusterPlatforms(days, next);
                if (activeClusterPlatform !== "all" && !available.includes(activeClusterPlatform)) setClusterPlatform(available[0]);
                setCluster(next);
              }} />
              <div className="cluster-platform-row">
                <MatrixChips label="Platform" items={[{ value: "all", label: "Semua Platform", color: "var(--builder-red)" },
                  ...clusterPlatforms.map((name) => ({ value: name, label: name, color: CONTENT_COLORS[name] }))]}
                  value={activeClusterPlatform} onChange={(value) => setClusterPlatform(value as ContentPlatform | "all")} />
                {activeClusterPlatform === "all" && <div className="matrix-search-group">
                  <input type="search" className={inputClass} aria-label="Cari topik cluster" placeholder="Cari topik…" value={clusterSearch} onChange={(event) => setClusterSearch(event.target.value)} />
                  <Button variant="outline" onClick={() => setShowAllClusterTopics(!showAllClusterTopics)}>
                    {showAllClusterTopics ? "Tampilkan ringkas (Top 20)" : `Tampilkan semua (${clusterTopics.length})`}
                  </Button>
                </div>}
              </div>
            </div>

            <ClusterTopicTable
              topics={topCluster}
              platforms={clusterPlatforms}
              platform={activeClusterPlatform}
              onTopic={setSelectedTopic}
              tableKey={`cluster-${cluster}-${activeClusterPlatform}-${from}-${to}-${clusterSearch}-${showAllClusterTopics}`}
            />
            {activeClusterPlatform === "all" && <MetricNote>
              Tiap platform menampilkan metrik mentahnya sendiri. Urutan berdasarkan jumlah
              platform yang memuat topik, lalu durasi TV dan Share untuk iNews/Sindonews,
              atau total Views digital untuk Okezone/IDX Channel.
            </MetricNote>}
          </Panel>
          <Panel
            title="IMG vs Kompetitor per Topik"
            subtitle="TV menggunakan Share tertimbang durasi; YouTube menggunakan Views terhadap kompetitor terkuat dalam pasangan cluster."
          >
            <ComparisonTable
              days={days}
              platform={comparisonPlatform}
              cluster={comparisonCluster}
              controls={<>
                <MatrixChips
                  label="Platform pembanding"
                  items={[
                    { value: "TV", label: "TV (Share)", color: CONTENT_COLORS.TV },
                    { value: "YouTube", label: "YouTube (Views)", color: CONTENT_COLORS.YouTube },
                  ]}
                  value={comparisonPlatform}
                  onChange={(value) =>
                    setComparisonPlatform(value as "TV" | "YouTube")
                  }
                />
                {comparisonPlatform === "YouTube" && (
                  <MatrixChips label="Cluster pembanding" items={clusterItems} value={comparisonCluster}
                    onChange={(value) => setComparisonCluster(value as ContentCluster)} />
                )}
              </>}
            />
            <MetricNote>
              {comparisonPlatform === "TV"
                ? "Share setiap channel = Σ(Durasi × Share) / ΣDurasi. Status vs TVOne dan KompasTV dihitung masing-masing. Status gabungan memakai rata-rata Share TVOne dan KompasTV, dikurangi Share iNews; setiap channel memiliki bobot sama, ambang seimbang ±0,5 poin. Data kosong ditampilkan sebagai tidak tersedia. Sindonews memakai basis Pay TV sehingga tidak dimasukkan."
                : "Margin = (Views kompetitor terkuat − Views cluster) / nilai tertinggi keduanya × 100; ambang seimbang ±20%. Jika salah satu pihak belum memiliki data, status Belum Ada Pembanding."}
            </MetricNote>
          </Panel>
        </>
      )}
      <div className="content-methodology">
        {methodology}
      </div>
      <TopicDetailDialog days={days} topics={topics} selectedTopic={selectedTopic} onClose={() => setSelectedTopic(null)}
        comparisonCluster={comparisonCluster} from={from} to={to} />
      </div>
    </DatasetStatus>
  );
}
