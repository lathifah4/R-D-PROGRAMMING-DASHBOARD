import { TV_TOPIC_ALIASES } from "./content-topic-aliases";
import { number } from "./dashboard-data";

export const CONTENT_PLATFORMS = [
  "TV",
  "YouTube",
  "Instagram",
  "TikTok",
  "Facebook",
  "X",
] as const;
export const CONTENT_CLUSTERS = [
  "iNews",
  "Sindonews",
  "Okezone",
  "IDX Channel",
] as const;
export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];
export type ContentCluster = (typeof CONTENT_CLUSTERS)[number];
export const CONTENT_COLORS: Record<ContentPlatform, string> = {
  TV: "#c2650a",
  YouTube: "#cc0000",
  Instagram: "#c13584",
  TikTok: "#0694a2",
  Facebook: "#1877f2",
  X: "#111111",
};

export function contentHeatColor(platform: ContentPlatform, value: number, maximum: number) {
  const intensity = maximum > 0 ? Math.round(Math.sqrt(Math.max(0, value) / maximum) * 55) : 0;
  return `color-mix(in srgb, ${CONTENT_COLORS[platform]} ${Math.min(55, intensity)}%, var(--builder-surface)) `;
}
export const CONTENT_SHEETS = [
  "INEWS",
  "TVONE",
  "KOMPAS",
  "SINDONEWS",
  "YOUTUBE",
  "SOCIAL MEDIA",
] as const;

export type ContentDay = {
  date: string;
  platform: ContentPlatform;
  cluster: string;
  topic: string;
  posts: number;
  duration: number;
  exposure: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};
export type ContentSource = {
  name: string;
  rows: number;
  coded: number;
  first: string;
  last: string;
};
export type ContentDataset = {
  days: ContentDay[];
  sources: ContentSource[];
  sindonewsGaps: string[];
};

export function contentCodingStatus(days: ContentDay[]) {
  return CONTENT_PLATFORMS.filter((platform) => platform !== "TV").map((platform) => {
    const rows = days.filter((row) => row.platform === platform);
    const total = rows.reduce((sum, row) => sum + row.posts, 0);
    const coded = rows.filter((row) => row.topic).reduce((sum, row) => sum + row.posts, 0);
    return { platform, total, coded, percentage: total ? coded / total * 100 : null };
  });
}
export type ContentMetric = Omit<
  ContentDay,
  "date" | "platform" | "cluster" | "topic"
>;
export type ContentTopic = {
  topic: string;
  order: number;
  metrics: Partial<Record<ContentPlatform, ContentMetric>>;
  contribution: Partial<Record<ContentPlatform, number>>;
  coverage: number;
  score: number;
  tier: "Panas" | "Tinggi" | "Pantau";
};

const WEIGHTS = {
  TV: 0.25,
  YouTube: 0.25,
  Instagram: 0.15,
  TikTok: 0.15,
  Facebook: 0.1,
  X: 0.1,
};
const STRUCTURAL = new Set([
  "opening",
  "hosting",
  "closing",
  "bumper",
  "commercial break",
  "commercial",
  "break",
  "promo",
  "iklan",
  "adzan",
  "adzan subuh",
  "adzan maghrib",
  "azan subuh",
  "azan maghrib",
  "headline",
  "headlines",
  "hl",
  "obb",
  "cbb",
  "teaser",
  "other",
  "others",
  "uncoded",
  "-",
]);
const clean = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
const topicKey = (value: unknown) => clean(value).toLocaleLowerCase("id");
const amount = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const round2 = (value: number) => Math.round(value * 100) / 100;
const emptyMetric = (): ContentMetric => ({
  posts: 0,
  duration: 0,
  exposure: 0,
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
});
function addMetric(target: ContentMetric, source: ContentMetric) {
  for (const key of [
    "posts",
    "duration",
    "exposure",
    "views",
    "likes",
    "comments",
    "shares",
  ] as const)
    target[key] += source[key];
}

export function contentDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000)
      .toISOString()
      .slice(0, 10);
  }
  const text = clean(value);
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const candidate = /^\d{4}-\d{2}-\d{2}/.test(text)
    ? text.slice(0, 10)
    : match
      ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
      : "";
  const parsed = Date.parse(`${candidate}T00:00:00Z`);
  return Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === candidate
    ? candidate
    : "";
}

function clusterName(value: unknown) {
  const name = clean(value);
  return (
    (
      {
        inews: "iNews",
        sindonews: "Sindonews",
        okezone: "Okezone",
        "idx channel": "IDX Channel",
        "tv one": "TVOne",
        tvone: "TVOne",
        kompastv: "KompasTV",
        "kompas tv": "KompasTV",
        metrotv: "MetroTV",
        "metro tv": "MetroTV",
        "kompas.com": "Kompas.com",
        "cnbc indonesia": "CNBC Indonesia",
      } as Record<string, string>
    )[name.toLowerCase()] ?? name
  );
}

export function buildContentDataset(
  tables: { name: string; values: unknown[][] }[],
): ContentDataset {
  const days = new Map<string, ContentDay>();
  const sources: ContentSource[] = [];
  const names = new Map<string, string>();
  for (const { name, values } of tables) {
    if (name !== "YOUTUBE" && name !== "SOCIAL MEDIA") continue;
    const index =
      values[0]?.findIndex((value) => clean(value) === "Isu Final (coding)") ??
      -1;
    if (index < 0)
      throw new Error(`Kolom Isu Final (coding) tidak ditemukan di ${name}.`);
    for (const row of values.slice(1)) {
      const label = clean(row[index]);
      if (label && !STRUCTURAL.has(topicKey(label))) {
        if (!names.has(topicKey(label))) names.set(topicKey(label), label);
      }
    }
  }
  const tvClusters: Record<string, string> = {
    INEWS: "iNews",
    TVONE: "TVOne",
    KOMPAS: "KompasTV",
    SINDONEWS: "Sindonews",
  };
  for (const { name, values } of tables) {
    const headers = (values[0] ?? []).map(clean);
    const tv = name in tvClusters;
    const dateIndex = headers.findIndex((key) =>
      ["DATE", "TANGGAL", "UPLOAD DATE"].includes(key.toUpperCase()),
    );
    const topicIndex = headers.indexOf(
      tv ? "AGENDA SETTING" : "Isu Final (coding)",
    );
    if (dateIndex < 0 || topicIndex < 0)
      throw new Error(`Struktur kolom sheet ${name} tidak sesuai.`);
    const source: ContentSource = {
      name,
      rows: 0,
      coded: 0,
      first: "",
      last: "",
    };
    for (const row of values.slice(1)) {
      if (
        !row.some(
          (value) => value !== null && value !== undefined && value !== "",
        )
      )
        continue;
      const date = contentDate(row[dateIndex]);
      if (!date) throw new Error(`Tanggal pada sheet ${name} tidak valid.`);
      const read = (key: string) => row[headers.indexOf(key)];
      const platformName = tv
        ? "TV"
        : name === "YOUTUBE"
          ? "YouTube"
          : clean(read("Platform"));
      const platform = CONTENT_PLATFORMS.find(
        (item) => item.toLowerCase() === platformName.toLowerCase(),
      );
      if (!platform)
        throw new Error(`Platform ${platformName} tidak dikenali.`);
      const cluster = tv
        ? tvClusters[name]
        : clusterName(read(name === "YOUTUBE" ? "Cluster" : "Akun"));
      const rawLabel = clean(row[topicIndex]);
      const label = tv && Object.hasOwn(TV_TOPIC_ALIASES, topicKey(rawLabel))
        ? TV_TOPIC_ALIASES[topicKey(rawLabel)] : rawLabel;
      const key = topicKey(label);
      const topic =
        !label || STRUCTURAL.has(key) ? "" : names.get(key) ?? label;
      source.rows++;
      source.coded += topic ? 1 : 0;
      if (!source.first || date < source.first) source.first = date;
      if (date > source.last) source.last = date;
      const share = tv ? read("Share") : 0;
      if (tv && (!clean(share) || !Number.isFinite(Number(share)))) continue;
      const identity = JSON.stringify([
        date,
        platform,
        cluster,
        topicKey(topic),
      ]);
      let entry = days.get(identity);
      if (!entry) {
        entry = { date, platform, cluster, topic, ...emptyMetric() };
        days.set(identity, entry);
      }
      const duration = tv ? amount(read("DUR")) : 0;
      // The combined workbook stores impressions in Views; prefer an explicit
      // impressions column when the source provides one, including a real zero.
      const impressions = ["Impressions", "Tayangan", "Impression"].map(read)
        .find((value) => value !== undefined && value !== null && value !== "");
      const views = tv ? 0 : amount(
        (platform === "Facebook" || platform === "X") && impressions !== undefined
          ? impressions : read("Views"),
      );
      addMetric(entry, {
        posts: 1,
        duration,
        exposure: tv ? duration * amount(share) : views,
        views,
        likes: amount(read("Likes")),
        comments: amount(read("Comments")),
        shares: amount(read("Shares")),
      });
    }
    sources.push(source);
  }
  const records = [...days.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const tvDates = new Set(
    records.filter((row) => row.platform === "TV").map((row) => row.date),
  );
  const sindoDates = new Set(
    records
      .filter((row) => row.platform === "TV" && row.cluster === "Sindonews")
      .map((row) => row.date),
  );
  return {
    days: records,
    sources,
    sindonewsGaps: [...tvDates].filter((day) => !sindoDates.has(day)).sort(),
  };
}

function groupContentTopics(days: ContentDay[]) {
  const groups = new Map<string, ContentTopic>();
  const totals = Object.fromEntries(
    CONTENT_PLATFORMS.map((platform) => [platform, 0]),
  ) as Record<ContentPlatform, number>;
  const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  const ordered = days.filter((day) => CONTENT_CLUSTERS.includes(day.cluster as ContentCluster))
    .sort((a, b) => CONTENT_PLATFORMS.indexOf(a.platform) - CONTENT_PLATFORMS.indexOf(b.platform)
      || compareText(a.date, b.date) || compareText(a.cluster, b.cluster) || compareText(a.topic, b.topic));
  for (const day of ordered) {
    if (!day.topic) continue;
    totals[day.platform] += day.exposure;
    const key = topicKey(day.topic);
    let topic = groups.get(key);
    if (!topic) {
      topic = {
        topic: day.topic,
        order: groups.size,
        metrics: {},
        contribution: {},
        coverage: 0,
        score: 0,
        tier: "Pantau",
      };
      groups.set(key, topic);
    }
    const metric = (topic.metrics[day.platform] ??= emptyMetric());
    addMetric(metric, day);
  }
  const topics = [...groups.values()];
  return { topics, totals };
}

export function contentTopics(days: ContentDay[]): ContentTopic[] {
  const { topics, totals } = groupContentTopics(days);
  const maximum = { ...totals };
  for (const platform of CONTENT_PLATFORMS) {
    maximum[platform] = Math.max(
      0,
      ...topics.map((topic) => {
        const metric = topic.metrics[platform];
        if (!metric) return 0;
        // Builder normalizes contributions after rounding them to two decimals.
        const contribution = totals[platform]
          ? round2((metric.exposure / totals[platform]) * 100)
          : 0;
        topic.contribution[platform] = contribution;
        topic.coverage++;
        return contribution;
      }),
    );
  }
  for (const topic of topics) {
    topic.score = CONTENT_PLATFORMS.reduce(
      (total, platform) =>
        total +
        (maximum[platform]
          ? ((topic.contribution[platform] ?? 0) / maximum[platform]) *
            WEIGHTS[platform] *
            100
          : 0),
      0,
    );
  }
  topics.sort(
    (a, b) =>
      Number(b.coverage === 6) - Number(a.coverage === 6) || b.score - a.score,
  );
  topics.forEach((topic, index) => {
    topic.tier = index < 10 ? "Panas" : index < 30 ? "Tinggi" : "Pantau";
  });
  return topics;
}

export function contentInsights(days: ContentDay[], topics = contentTopics(days)) {
  const labels = [
    "Konten Terbaik Lintas Platform",
    "Karakter Platform Beda-Beda",
    "Peluang Terlewat TV ↔ Digital",
    "Posisi Kompetitif TV (FTA)",
  ];
  const accents = ["brand", "X", "Instagram", "competitor"];
  if (!topics.length) return labels.map((label, index) => ({
    label, value: "–", note: "Tidak ada data pada rentang ini.", accent: accents[index],
  }));

  const top = topics[0];
  const contributions = CONTENT_PLATFORMS.map((platform) => ({
    platform, value: top.contribution[platform] ?? 0,
  })).sort((a, b) => b.value - a.value);
  const generic = [/Lainnya$/, /Harian$/, /^Infotainment/, /^Info & Tips/, /^Iklan & Konten/, /^Konten Viral/, /^Pendidikan & Kepegawaian$/, /^Kebijakan Kesehatan/, /^Layanan Transportasi Publik/, /^Program & Event Internal$/, /^Religi & Dakwah$/, /^Sains, Teknologi/, /Berita Pasar Harian/];
  const specific = topics.filter((topic) => !generic.some((pattern) => pattern.test(topic.topic)));
  let bestSkew: { topic: string; platform: ContentPlatform; value: number; second: { platform: ContentPlatform; value: number }; skew: number } | undefined;
  for (const topic of specific) {
    if (topic === top) continue;
    const ranked = CONTENT_PLATFORMS.filter((platform) => topic.contribution[platform] != null)
      .map((platform) => ({ platform, value: topic.contribution[platform]! }))
      .sort((a, b) => b.value - a.value);
    if (ranked.length < 3) continue;
    const skew = ranked[0].value - ranked[1].value;
    if (skew > 0 && (!bestSkew || skew > bestSkew.skew))
      bestSkew = { topic: topic.topic, ...ranked[0], second: ranked[1], skew };
  }
  const digital = CONTENT_PLATFORMS.filter((platform) => platform !== "TV");
  const digitalOnly = specific.filter((topic) => !topic.metrics.TV && digital.some((platform) => topic.metrics[platform]))
    .map((topic) => {
      const platform = digital.filter((platform) => topic.metrics[platform])
        .sort((a, b) => topic.metrics[b]!.views - topic.metrics[a]!.views)[0];
      return { topic: topic.topic, platform, metric: topic.metrics[platform]! };
    }).sort((a, b) => b.metric.views - a.metric.views)[0];
  const tvOnly = specific.filter((topic) => topic.metrics.TV && digital.every((platform) => !topic.metrics[platform]))
    .sort((a, b) => b.metrics.TV!.duration - a.metrics.TV!.duration)[0];
  const comparisons = contentComparison(days, "TV", "iNews");
  const comparable = comparisons.filter((row) => row.gap !== null);
  const wins = comparable.filter((row) => row.status === "iNews Unggul").length;
  const losses = comparable.filter((row) => row.status === "Kompetitor Unggul").length;
  const balanced = comparable.filter((row) => row.status === "Seimbang").length;

  return [
    {
      label: labels[0], value: top.topic, accent: "brand",
      note: `Performa terkuat di ${contributions[0].platform} (${number(contributions[0].value, 2)}%) dan ${contributions[1].platform} (${number(contributions[1].value, 2)}%) · `
        + contributions.slice(2).map(({ platform, value }) => `${platform} ${number(value, 2)}%`).join(" · "),
    },
    {
      label: labels[1], value: bestSkew ? `${number(bestSkew.value, 2)}% di ${bestSkew.platform}` : "–",
      accent: bestSkew?.platform ?? "X",
      note: bestSkew
        ? `${bestSkew.topic} kuat khusus di ${bestSkew.platform}, platform lain di bawah ${number(bestSkew.second.value, 2)}% (${bestSkew.second.platform} tertinggi kedua ${number(bestSkew.second.value, 2)}%)`
        : "Belum ada topik dengan dominasi satu platform yang jelas pada rentang ini.",
    },
    {
      label: labels[2], value: digitalOnly ? "0 menit TV" : "–", accent: "Instagram",
      note: digitalOnly
        ? `${digitalOnly.topic} tembus ${contentCompact(digitalOnly.metric.views)} views ${digitalOnly.platform} (${digitalOnly.metric.posts} post) tapi 0 menit di TV.`
          + (tvOnly ? ` Pola sebaliknya juga ada (${tvOnly.topic}: ${Math.round(tvOnly.metrics.TV!.duration)} menit TV, nihil di semua platform digital).` : "")
        : "Tidak ada contoh topik digital-only yang menonjol pada rentang ini.",
    },
    {
      label: labels[3], value: `${number(wins)} vs ${number(losses)}`, accent: "competitor",
      note: comparable.length
        ? `Topik iNews Unggul vs Kompetitor Unggul (${number(balanced)} Seimbang) dari ${number(comparable.length)} topik head-to-head (ketiga channel FTA sama-sama tayang) · ${number(comparisons.length - comparable.length)} topik lain belum ada pembanding`
        : "Tidak ada topik FTA dengan ketiga channel sama-sama tayang pada rentang ini.",
    },
  ];
}

export function clusterMetrics(days: ContentDay[], cluster: string) {
  const metrics: Partial<Record<ContentPlatform, ContentMetric>> = {};
  for (const day of days) {
    if (day.cluster !== cluster) continue;
    addMetric((metrics[day.platform] ??= emptyMetric()), day);
  }
  return metrics;
}

export function contentClusterPlatforms(days: ContentDay[], cluster: ContentCluster) {
  return CONTENT_PLATFORMS.filter((platform) => platform === "TV"
    ? cluster === "iNews" || cluster === "Sindonews"
    : platform !== "X" || days.some((day) => day.cluster === cluster && day.platform === "X" && day.posts > 0));
}

export function contentClusterTopics(
  days: ContentDay[],
  cluster: ContentCluster,
  platform: ContentPlatform | "all" = "all",
) {
  const topics = contentTopics(days.filter((day) => day.cluster === cluster));
  if (platform === "all") return topics.sort((a, b) => {
    const coverage = b.coverage - a.coverage;
    if (coverage) return coverage;
    if (cluster === "iNews" || cluster === "Sindonews") {
      const share = (topic: ContentTopic) => topic.metrics.TV?.duration
        ? topic.metrics.TV.exposure / topic.metrics.TV.duration : 0;
      return (b.metrics.TV?.duration ?? 0) - (a.metrics.TV?.duration ?? 0)
        || share(b) - share(a) || a.order - b.order;
    }
    const views = (topic: ContentTopic) => CONTENT_PLATFORMS.reduce(
      (sum, name) => sum + (topic.metrics[name]?.views ?? 0), 0);
    return views(b) - views(a) || a.order - b.order;
  });
  return topics.filter((topic) => topic.metrics[platform]).sort((a, b) =>
    (b.metrics[platform]?.exposure ?? 0) - (a.metrics[platform]?.exposure ?? 0) || b.score - a.score);
}

export function contentCompact(value: number) {
  const format = (amount: number, digits: number) => new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(amount);
  if (value >= 1e9) return `${format(value / 1e9, 2)} M`;
  if (value >= 1e6) return `${format(value / 1e6, 1)} Jt`;
  if (value >= 1e3) return `${format(value / 1e3, 0)} Rb`;
  return format(value, 0);
}

export const YOUTUBE_COMPETITORS: Record<ContentCluster, string[]> = {
  iNews: ["TVOne", "KompasTV"],
  Sindonews: ["MetroTV"],
  Okezone: ["Kompas.com"],
  "IDX Channel": ["CNBC Indonesia"],
};

function comparisonStatus(gap: number | null, threshold: number, own: string) {
  if (gap === null) return "Belum Ada Pembanding";
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(gap), threshold) * 8;
  if (Math.abs(gap) <= threshold + tolerance) return "Seimbang";
  return gap > 0 ? "Kompetitor Unggul" : `${own} Unggul`;
}

export function contentComparison(
  days: ContentDay[],
  platform: "TV" | "YouTube",
  cluster: ContentCluster,
) {
  const own = platform === "TV" ? "iNews" : cluster;
  const competitors =
    platform === "TV" ? ["TVOne", "KompasTV"] : YOUTUBE_COMPETITORS[cluster];
  const topics = new Map<
    string,
    { topic: string; values: Map<string, ContentMetric> }
  >();
  for (const day of days) {
    if (
      day.platform !== platform ||
      !day.topic ||
      ![own, ...competitors].includes(day.cluster)
    )
      continue;
    const key = topicKey(day.topic);
    if (!topics.has(key))
      topics.set(key, { topic: day.topic, values: new Map() });
    const values = topics.get(key)!.values;
    if (!values.has(day.cluster)) values.set(day.cluster, emptyMetric());
    addMetric(values.get(day.cluster)!, day);
  }
  return [...topics.values()].map(({ topic, values }) => {
    const metric = (name: string) => {
      const value = values.get(name);
      return value
        ? platform === "TV"
          ? value.duration > 0
            ? round2(value.exposure / value.duration)
            : null
          : value.views
        : null;
    };
    const ownValue = metric(own);
    const otherValues = competitors.map((name) => metric(name));
    const best = Math.max(0, ...otherValues.map((value) => value ?? 0));
    const comparable =
      platform === "TV"
        ? ownValue !== null && otherValues.every((value) => value !== null)
        : ownValue !== null && otherValues.some((value) => value !== null);
    const competitorShare = comparable && platform === "TV"
      ? otherValues.reduce<number>((sum, value) => sum + value!, 0) / competitors.length : null;
    const denominator = Math.max(best, ownValue ?? 0);
    const gap = !comparable ? null : platform === "TV"
      ? round2(competitorShare! - ownValue!)
      : denominator > 0 ? (best - ownValue!) / denominator * 100 : 0;
    const threshold = platform === "TV" ? 0.5 : 20;
    return {
      topic,
      own: ownValue,
      competitors: Object.fromEntries(
        competitors.map((name, index) => [name, otherValues[index]]),
      ),
      gap,
      status: comparisonStatus(gap, threshold, own),
      competitorStatuses: platform === "TV" ? Object.fromEntries(competitors.map((name, index) => [name,
        comparisonStatus(ownValue === null || otherValues[index] === null ? null : round2(otherValues[index]! - ownValue), 0.5, own)])) : {},
      total: [...values.values()].reduce((sum, value) => sum + (platform === "TV" ? value.duration : value.views), 0),
    };
  }).filter((row) => row.own !== null || Object.values(row.competitors).some((value) => value !== null))
    .sort((a, b) => b.total - a.total);
}
