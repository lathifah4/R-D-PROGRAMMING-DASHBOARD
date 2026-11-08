import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { number } from "../lib/dashboard-data";
import {
  buildContentDataset,
  clusterMetrics,
  contentClusterPlatforms,
  contentClusterTopics,
  contentCompact,
  contentComparison,
  contentDate,
  contentTopics,
  contentHeatColor,
  contentInsights,
  contentCodingStatus,
  type ContentDay,
} from "../lib/content-data";

describe("Content spreadsheet", () => {
  test("matrix, weighted score and executive notes use Builder's rounded contributions", () => {
    const data = buildContentDataset([{ name: "YOUTUBE", values: [
      ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
      ["iNews", "01/09/2026", 1146, "Kecil"],
      ["iNews", "01/09/2026", 98854, "Besar"],
    ] }]);
    const topics = contentTopics(data.days);
    const small = topics.find((topic) => topic.topic === "Kecil")!;
    assert.equal(small.contribution.YouTube, 1.15);
    assert.equal(number(small.contribution.YouTube, 1), "1,2");
    assert.equal(small.metrics.YouTube!.views, 1146);
    assert.ok(Math.abs(small.score - 0.29084471421345476) < 1e-10);
    assert.match(contentInsights(data.days, topics)[0].note, /YouTube \(98,85%\)/);
  });

  test("executive FTA counts use the same rounded boundary as the comparison table", () => {
    const data = buildContentDataset(["INEWS", "TVONE", "KOMPAS"].map((name) => ({ name, values: [
      ["Date", "DUR", "Share", "AGENDA SETTING"],
      ["01/09/2026", 10, name === "INEWS" ? 5 : 4.499, "Batas Seimbang"],
      ["01/09/2026", 10, name === "INEWS" ? 5 : 4.49, "Unggul"],
    ] })));
    assert.equal(contentInsights(data.days)[3].value, "1 vs 0");
    assert.match(contentInsights(data.days)[3].note, /1 Seimbang.*2 topik head-to-head/);
    assert.equal(contentComparison(data.days, "TV", "iNews").find(row => row.topic === "Batas Seimbang")!.gap, -0.5);
  });

  test("all panels reuse the inclusive active dates and coded denominators without changing total source KPIs", () => {
    const row = (date: string, platform: ContentDay["platform"], cluster: string, topic: string, exposure: number, duration = 1): ContentDay => ({
      date, platform, cluster, topic, exposure, duration, posts: 1,
      views: platform === "TV" ? 0 : exposure, likes: 0, comments: 0, shares: 0,
    });
    const input = [
      row("2026-10-08", "TV", "iNews", "Di luar", 99999),
      row("2026-10-09", "TV", "iNews", "A", 60, 10),
      row("2026-10-16", "TV", "iNews", "A", 20, 10),
      row("2026-10-16", "TV", "iNews", "B", 20, 10),
      row("2026-10-16", "TV", "iNews", "", 900, 100),
      row("2026-10-16", "TV", "Sindonews", "B", 100, 10),
      row("2026-10-16", "TV", "TVOne", "A", 1000, 100),
      row("2026-10-16", "TV", "KompasTV", "A", 0, 1),
      row("2026-10-17", "TV", "iNews", "Di luar", 99999),
      row("2026-10-09", "YouTube", "iNews", "A", 10),
      row("2026-10-16", "YouTube", "iNews", "B", 90),
      row("2026-10-16", "YouTube", "iNews", "", 900),
    ];
    const days = input.filter((day) => day.date >= "2026-10-09" && day.date <= "2026-10-16");
    const matrix = contentTopics(days);
    const cluster = contentClusterTopics(days, "iNews", "TV");
    assert.deepEqual(matrix.map((topic) => topic.topic).sort(), ["A", "B"]);
    assert.equal(matrix.find((topic) => topic.topic === "A")!.contribution.TV, 40);
    assert.equal(matrix.find((topic) => topic.topic === "A")!.contribution.YouTube, 10);
    assert.equal(cluster.find((topic) => topic.topic === "A")!.contribution.TV, 80);
    const comparison = contentComparison(days, "TV", "iNews").find((topic) => topic.topic === "A")!;
    assert.equal(comparison.own, 4);
    assert.equal(comparison.gap, 1);
    assert.equal(comparison.status, "Kompetitor Unggul");
    assert.equal(contentInsights(days)[3].value, "0 vs 1");
    assert.equal(clusterMetrics(days, "iNews").TV!.exposure, 1000);
    assert.equal(clusterMetrics(days, "iNews").YouTube!.views, 1000);
    assert.deepEqual(contentTopics([...days].reverse()), matrix);
    assert.deepEqual(contentTopics(days), matrix);
    assert.equal(contentTopics(input.filter((day) => day.date === "2026-10-09"))[0].contribution.TV, 100);
  });

  test("coding completeness uses post counts from the full dataset, including uncoded content", () => {
    const data = buildContentDataset([{ name: "YOUTUBE", values: [
      ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
      ["iNews", "01/09/2026", 100, "Utama"],
      ["iNews", "02/09/2026", 900, "Other"],
      ["iNews", "02/09/2026", 0, "Utama"],
    ] }]);
    const status = contentCodingStatus(data.days);
    assert.deepEqual(status.find((row) => row.platform === "YouTube"), { platform: "YouTube", total: 3, coded: 2, percentage: 2 / 3 * 100 });
    assert.equal(status.find((row) => row.platform === "X")!.percentage, null);
    contentTopics(data.days.filter((row) => row.date === "2026-09-01"));
    assert.deepEqual(contentCodingStatus(data.days), status);
  });
  test("builds all executive notes from spreadsheet metrics and recalculates the selected dates", () => {
    const data = buildContentDataset([
      { name: "INEWS", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 10, 5, "Utama"], ["01/09/2026", 8, 3, "Televisi"],
        ["01/09/2026", 2, 1, "Timpang"], ["01/09/2026", 1, 1, "Parsial"],
        ["02/09/2026", 4, 7, "Baru"],
      ] },
      { name: "TVONE", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 10, 3, "Utama"], ["01/09/2026", 8, 5, "Televisi"],
        ["01/09/2026", 2, 1, "Timpang"], ["02/09/2026", 4, 9, "Baru"],
      ] },
      { name: "KOMPAS", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 10, 3, "Utama"], ["01/09/2026", 8, 5, "Televisi"],
        ["01/09/2026", 2, 1, "Timpang"], ["02/09/2026", 4, 9, "Baru"],
      ] },
      { name: "YOUTUBE", values: [
        ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
        ["iNews", "01/09/2026", 100, "Utama"], ["iNews", "01/09/2026", 10, "Timpang"],
        ["iNews", "01/09/2026", 25000, "Digital"], ["iNews", "02/09/2026", 50, "Baru"],
      ] },
      { name: "SOCIAL MEDIA", values: [
        ["Platform", "Akun", "Tanggal", "Views", "Isu Final (coding)"],
        ["Instagram", "iNews", "01/09/2026", 100, "Utama"],
        ["Instagram", "iNews", "01/09/2026", 900, "Timpang"],
        ["TikTok", "iNews", "01/09/2026", 100, "Utama"],
        ["Facebook", "iNews", "01/09/2026", 100, "Utama"],
        ["X", "iNews", "01/09/2026", 100, "Utama"],
      ] },
    ]);
    const firstDay = data.days.filter((day) => day.date === "2026-09-01");
    const first = contentInsights(firstDay);
    assert.equal(first[0].value, "Utama");
    assert.equal(first[0].note, "Performa terkuat di TikTok (100,00%) dan Facebook (100,00%) · X 100,00% · TV 64,94% · Instagram 10,00% · YouTube 0,40%");
    assert.equal(first[1].label, "Karakter Platform Beda-Beda");
    assert.equal(first[1].value, "90,00% di Instagram");
    assert.equal(first[1].accent, "Instagram");
    assert.equal(first[1].note, "Timpang kuat khusus di Instagram, platform lain di bawah 2,60% (TV tertinggi kedua 2,60%)");
    assert.equal(first[2].label, "Peluang Terlewat TV ↔ Digital");
    assert.equal(first[2].value, "0 menit TV");
    assert.equal(first[2].note, "Digital tembus 25 Rb views YouTube (1 post) tapi 0 menit di TV. Pola sebaliknya juga ada (Televisi: 8 menit TV, nihil di semua platform digital).");
    assert.equal(first[3].value, "1 vs 1");
    assert.match(first[3].note, /1 Seimbang.*3 topik head-to-head.*1 topik lain belum ada pembanding/);

    const second = contentInsights(data.days.filter((day) => day.date === "2026-09-02"));
    assert.equal(second[0].value, "Baru");
    assert.equal(second[0].note, "Performa terkuat di TV (100,00%) dan YouTube (100,00%) · Instagram 0,00% · TikTok 0,00% · Facebook 0,00% · X 0,00%");
    assert.equal(second[1].value, "–");
    assert.equal(second[1].note, "Belum ada topik dengan dominasi satu platform yang jelas pada rentang ini.");
    assert.equal(second[2].value, "–");
    assert.equal(second[2].note, "Tidak ada contoh topik digital-only yang menonjol pada rentang ini.");
    assert.equal(second[3].value, "0 vs 1");
    assert.match(second[3].note, /0 Seimbang.*1 topik head-to-head/);
  });

  test("does not invent opportunity or competitor notes for missing or generic data", () => {
    assert.ok(contentInsights([]).every((card) => card.value === "–" && card.note === "Tidak ada data pada rentang ini."));
    const data = buildContentDataset([{ name: "YOUTUBE", values: [
      ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
      ["iNews", "01/09/2026", 100000, "Info & Tips Kesehatan"],
    ] }]);
    const cards = contentInsights(data.days);
    assert.equal(cards[1].value, "–");
    assert.equal(cards[2].value, "–");
    assert.equal(cards[2].note, "Tidak ada contoh topik digital-only yang menonjol pada rentang ini.");
    assert.equal(cards[3].value, "0 vs 0");
    assert.equal(cards[3].note, "Tidak ada topik FTA dengan ketiga channel sama-sama tayang pada rentang ini.");
    assert.ok(cards.every((card) => !/undefined|NaN/.test(card.value + card.note)));
  });

  test("excludes missing TV Share from performance without dropping a real zero", () => {
    const data = buildContentDataset([{ name: "INEWS", values: [
      ["Date", "DUR", "Share", "AGENDA SETTING"],
      ["01/09/2026", 2, 0, "Valid"],
      ["01/09/2026", 2, 4, "Valid"],
      ["01/09/2026", 20, null, "Valid"],
      ["01/09/2026", 20, "", "Only missing"],
      ["01/09/2026", 20, "N/A", "Only missing"],
    ] }]);
    assert.equal(data.sources[0].rows, 5);
    assert.equal(data.days.length, 1);
    assert.equal(data.days[0].posts, 2);
    assert.equal(data.days[0].duration, 4);
    assert.equal(data.days[0].exposure, 8);
    assert.equal(contentComparison(data.days, "TV", "iNews")[0].own, 2);
  });

  test("uses source coding labels to join the same TV and digital issue without a Builder label catalog", () => {
    const data = buildContentDataset([
      { name: "INEWS", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 1, 2, "APBN 2027"],
        ["01/09/2026", 1, 3, "SIDANG UMUM PBB"],
        ["01/09/2026", 1, 5, "AFC CHAMPIONS LEAGUE ELITE"],
      ] },
      { name: "YOUTUBE", values: [
        ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
        ["iNews", "01/09/2026", 10, "APBN 2027"],
        ["iNews", "01/09/2026", 20, "Sidang Umum PBB"],
        ["iNews", "01/09/2026", 30, "AFC Champions League Elite"],
      ] },
    ]);
    const topics = contentTopics(data.days);
    assert.equal(topics.length, 3);
    assert.deepEqual(Object.fromEntries(topics.filter((row) => row.metrics.TV).map((row) => [row.topic, row.contribution.TV])), {
      "AFC Champions League Elite": 50, "Sidang Umum PBB": 30, "APBN 2027": 20,
    });
    assert.equal(topics.find((row) => row.topic === "APBN 2027")?.metrics.TV?.exposure, 2);
    assert.equal(topics.find((row) => row.topic === "AFC Champions League Elite")?.score, 50);
    assert.deepEqual(contentTopics([...data.days].reverse()), topics);
  });

  test("capitalization variants of one coding label do not split its contribution or competitor rows", () => {
    const data = buildContentDataset([{ name: "YOUTUBE", values: [
      ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
      ["iNews", "01/09/2026", 100, "Sidang Umum PBB"],
      ["iNews", "01/09/2026", 20, "Sidang Umum Pbb"],
      ["TV One", "01/09/2026", 200, "Sidang Umum PBB"],
    ] }]);
    assert.equal(data.days.length, 2);
    assert.equal(contentTopics(data.days).length, 1);
    assert.deepEqual(contentTopics(data.days).map((topic) => topic.contribution.YouTube), [100]);
    assert.deepEqual(contentClusterTopics(data.days, "iNews", "YouTube").map((topic) => topic.metrics.YouTube?.views), [120]);
    assert.equal(contentComparison(data.days, "YouTube", "iNews").length, 1);
  });

  test("cluster default ranking uses coverage then TV duration or digital views; single-platform ranking uses exposure", () => {
    const tv = (topic: string, duration: number, exposure: number): ContentDay => ({
      date: "2026-09-01", platform: "TV", cluster: "iNews", topic,
      duration, exposure, views: 0, posts: 1, likes: 0, comments: 0, shares: 0,
    });
    const digital = (topic: string, platform: ContentDay["platform"], cluster = "iNews", views = 100): ContentDay => ({
      ...tv(topic, 0, views), platform, cluster, views,
    });
    const days = [
      tv("Singkat share tinggi", 1, 20), tv("Durasi besar", 100.4, 100.4),
      tv("Kontribusi terbesar", 50, 500),
      digital("Singkat share tinggi", "YouTube"), digital("Durasi besar", "YouTube"),
      digital("Kontribusi terbesar", "YouTube"), digital("Hanya digital", "YouTube"),
      digital("Hanya digital", "Instagram"), digital("Hanya digital", "TikTok"),
      digital("Okezone besar", "YouTube", "Okezone", 1000),
      digital("Okezone kecil", "YouTube", "Okezone", 1),
    ];
    assert.deepEqual(contentClusterTopics(days, "iNews", "TV").map((row) => row.topic),
      ["Kontribusi terbesar", "Durasi besar", "Singkat share tinggi"]);
    assert.deepEqual(contentClusterTopics(days, "iNews").map((row) => row.topic),
      ["Hanya digital", "Durasi besar", "Kontribusi terbesar", "Singkat share tinggi"]);
    assert.equal(contentClusterTopics(days, "iNews", "TV")[0].contribution.TV, 80.59);
    assert.deepEqual(contentClusterPlatforms(days, "Okezone"), ["YouTube", "Instagram", "TikTok", "Facebook"]);
    assert.deepEqual(contentClusterTopics(days, "Okezone").map((row) => row.topic), ["Okezone besar", "Okezone kecil"]);
    assert.equal(contentClusterPlatforms([...days, digital("X", "X", "Okezone")], "Okezone").at(-1), "X");
    assert.deepEqual([814165059, 314287570, 8447587, 12345, 12.5].map(contentCompact),
      ["814,2 Jt", "314,3 Jt", "8,4 Jt", "12 Rb", "13"]);
  });

  test("orders competitor topics by total duration or total Views, including one-sided rows", () => {
    const row = (topic: string, cluster: string, value: number, duration = 1, platform: "TV" | "YouTube" = "TV"): ContentDay => ({
      date: "2026-09-01", platform, cluster, topic, posts: 1, duration,
      exposure: value * duration, views: platform === "TV" ? 0 : value, likes: 0, comments: 0, shares: 0,
    });
    const days = [
      row("Share tinggi", "iNews", 20),
      row("Durasi terbesar", "iNews", 1, 10), row("Durasi terbesar", "TVOne", 2, 100),
      row("Nol durasi", "iNews", 9, 0),
      row("Own tertinggi", "Okezone", 500, 0, "YouTube"),
      row("Total tertinggi", "Okezone", 1, 0, "YouTube"), row("Total tertinggi", "Kompas.com", 1000, 0, "YouTube"),
      row("Nol views", "Okezone", 0, 0, "YouTube"),
    ];
    const tv = contentComparison(days, "TV", "iNews");
    assert.deepEqual(tv.map((value) => value.topic), ["Durasi terbesar", "Share tinggi"]);
    assert.equal(tv[0].competitors.KompasTV, null);
    assert.equal(tv[0].status, "Belum Ada Pembanding");
    const youtube = contentComparison(days, "YouTube", "Okezone");
    assert.deepEqual(youtube.map((value) => value.topic), ["Total tertinggi", "Own tertinggi", "Nol views"]);
    assert.equal(youtube[0].gap, 99.9);
    assert.equal(youtube[0].status, "Kompetitor Unggul");
    assert.equal(youtube[1].competitors["Kompas.com"], null);
  });

  test("keeps structural rows in cluster KPIs but excludes them from topic contribution totals", () => {
    const data = buildContentDataset([
      {
        name: "INEWS",
        values: [
          ["Date", "DUR", "Share", "AGENDA SETTING"],
          [46023, 1, 2, "TOPIK A"],
          [46023, 3, 4, "Topik A"],
          [46023, 10, 6, "HOSTING"],
        ],
      },
      {
        name: "SINDONEWS",
        values: [
          ["DATE", "DUR", "Share", "AGENDA SETTING"],
          [46024, 2, 3, "TOPIK A"],
        ],
      },
      {
        name: "TVONE",
        values: [
          ["Date", "DUR", "Share", "AGENDA SETTING"],
          [46023, 2, 7, "TOPIK A"],
        ],
      },
      {
        name: "KOMPAS",
        values: [
          ["Date", "DUR", "Share", "AGENDA SETTING"],
          [46023, 2, 5, "TOPIK A"],
        ],
      },
      {
        name: "YOUTUBE",
        values: [
          ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
          ["iNews", "01/01/2026", 100, "Topik A"],
          ["iNews", "01/01/2026", 200, "Other"],
          ["TV One", "01/01/2026", 150, "Topik A"],
        ],
      },
      {
        name: "SOCIAL MEDIA",
        values: [
          ["Platform", "Akun", "Tanggal", "Views", "Isu Final (coding)"],
          ["Instagram", "iNews", "2026-01-01", 50, "Topik A"],
        ],
      },
    ]);
    assert.equal(contentDate(46023.9), "2026-01-01");
    assert.equal(contentDate("1/1/2026"), "2026-01-01");
    assert.equal(contentDate("not a date"), "");
    assert.equal(contentDate("31/02/2026"), "");
    assert.equal(contentDate("2026-99-01"), "");
    assert.equal(data.sources[0].rows, 3);
    assert.equal(data.sources[0].coded, 2);
    assert.deepEqual(data.sindonewsGaps, ["2026-01-01"]);
    const metric = clusterMetrics(data.days, "iNews");
    assert.equal(metric.TV?.duration, 14);
    assert.equal(metric.YouTube?.views, 300);
    const topics = contentTopics(data.days);
    assert.equal(topics.length, 1);
    assert.equal(topics[0].topic, "Topik A");
    assert.equal(topics[0].metrics.TV?.duration, 6);
    assert.equal(topics[0].metrics.YouTube?.views, 100);
    assert.equal(topics[0].contribution.TV, 100);
    assert.equal(topics[0].contribution.YouTube, 100);
    assert.equal(topics[0].score, 65);
    const tv = contentComparison(data.days, "TV", "iNews")[0];
    assert.equal(tv.own, 3.5);
    assert.equal(tv.gap, 2.5);
    assert.equal(tv.status, "Kompetitor Unggul");
    const yt = contentComparison(data.days, "YouTube", "iNews")[0];
    assert.ok(Math.abs(yt.gap! - 100 / 3) < 1e-10);
    assert.equal(yt.status, "Kompetitor Unggul");
    assert.equal(contentComparison(data.days, "YouTube", "Okezone").length, 0);
    assert.throws(
      () => buildContentDataset([{ name: "INEWS", values: [["Wrong"]] }]),
      /Struktur/,
    );
  });

  test("keeps missing competitors distinct from zero and prioritizes topics present on all six platforms", () => {
    const row = (
      platform: ContentDay["platform"],
      topic: string,
      views: number,
    ): ContentDay => ({
      date: "2026-01-01",
      platform,
      cluster: "iNews",
      topic,
      posts: 1,
      duration: platform === "TV" ? 1 : 0,
      exposure: views,
      views: platform === "TV" ? 0 : views,
      likes: 0,
      comments: 0,
      shares: 0,
    });
    const days = [
      row("TV", "Dominan TV", 100),
      ...(
        ["TV", "YouTube", "Instagram", "TikTok", "Facebook", "X"] as const
      ).map((platform) => row(platform, "Lengkap", 1)),
    ];
    const topics = contentTopics(days);
    assert.equal(topics[0].topic, "Lengkap");
    assert.equal(topics[0].coverage, 6);
    const comparison = contentComparison(days, "TV", "iNews");
    assert.ok(
      comparison.every(
        (value) =>
          value.gap === null && value.status === "Belum Ada Pembanding",
      ),
    );
    assert.equal(topics[1].metrics.YouTube, undefined);
  });

  test("uses Facebook/X impressions when supplied and the combined Views column otherwise", () => {
    const data = buildContentDataset([{ name: "SOCIAL MEDIA", values: [
      ["Platform", "Akun", "Tanggal", "Views", "Impressions", "Tayangan", "Isu Final (coding)"],
      ["Facebook", "iNews", "2026-09-01", 1, 900, null, "A"],
      ["X", "iNews", "2026-09-01", 100, 0, null, "A"],
      ["Facebook", "iNews", "2026-09-02", 2, null, 300, "A"],
      ["X", "iNews", "2026-09-02", 700, null, null, "A"],
      ["Instagram", "iNews", "2026-09-02", 50, 999, null, "A"],
    ] }]);
    const metrics = clusterMetrics(data.days, "iNews");
    assert.equal(metrics.Facebook?.exposure, 1200);
    assert.equal(metrics.X?.exposure, 700);
    assert.equal(metrics.Instagram?.exposure, 50);
    assert.equal(data.days.find((row) => row.platform === "X" && row.date === "2026-09-01")?.views, 0);
  });

  test("normalizes each platform before weighting, prioritizes completeness, and recalculates the active range", () => {
    const platforms = ["TV", "YouTube", "Instagram", "TikTok", "Facebook", "X"] as const;
    const make = (topic: string, platform: ContentDay["platform"], value: number, date = "2026-09-01"): ContentDay => ({
      topic, platform, date, cluster: "iNews", posts: 1, duration: platform === "TV" ? 1 : 0,
      exposure: value, views: platform === "TV" ? 0 : value, likes: 0, comments: 0, shares: 0,
    });
    const days = [
      ...platforms.map((platform) => make("Lengkap", platform, 1)),
      ...platforms.slice(0, 5).map((platform) => make("Parsial", platform, 100)),
      make("Hari kedua", "YouTube", 1_000_000, "2026-09-02"),
    ];
    const full = contentTopics(days);
    assert.equal(full[0].topic, "Lengkap");
    assert.ok(full[0].score < full.find((row) => row.topic === "Parsial")!.score);
    const firstDay = contentTopics(days.filter((row) => row.date === "2026-09-01"));
    assert.ok(Math.abs(firstDay[0].score - (10 + 90 * 0.99 / 99.01)) < 1e-9);
    const secondDay = contentTopics(days.filter((row) => row.date === "2026-09-02"));
    assert.equal(secondDay.length, 1);
    assert.equal(secondDay[0].score, 25);
    assert.equal(secondDay[0].contribution.YouTube, 100);
    assert.equal(secondDay[0].tier, "Panas");
    assert.equal(contentHeatColor("Facebook", 25, 100).trim(), "color-mix(in srgb, #1877f2 28%, var(--builder-surface))");
    assert.equal(contentHeatColor("TV", 0, 0).trim(), "color-mix(in srgb, #c2650a 0%, var(--builder-surface))");
  });

  test("applies TV topic mapping and excludes structural airtime from the contribution denominator", () => {
    const data = buildContentDataset([
      { name: "INEWS", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 5, 4, "POLEMIK IJAZAH GIBRAN"],
        ["01/09/2026", 2, 3, "PERANG ISRAEL-PALESTINA"],
        ["01/09/2026", 1, 2, "KONFLIK TIMUR TENGAH"],
        ["01/09/2026", 10, 9, "BREAKING NEWS"],
      ] },
      { name: "TVONE", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 2, 5, "POLEMIK IJAZAH GIBRAN"],
      ] },
      { name: "KOMPAS", values: [
        ["Date", "DUR", "Share", "AGENDA SETTING"],
        ["01/09/2026", 1, 6, "Ijazah Gibran"],
      ] },
      { name: "YOUTUBE", values: [
        ["Cluster", "Upload Date", "Views", "Isu Final (coding)"],
        ["iNews", "01/09/2026", 100, "Ijazah Gibran"],
        ["iNews", "01/09/2026", 200, "Konflik Timur Tengah"],
      ] },
    ]);
    const topics = contentTopics(data.days);
    assert.equal(topics.length, 2);
    const diploma = topics.find((topic) => topic.topic === "Ijazah Gibran")!;
    assert.equal(diploma.coverage, 2);
    assert.equal(diploma.contribution.TV, 71.43);
    assert.equal(diploma.metrics.TV?.duration, 5);
    const conflict = topics.find((topic) => topic.topic === "Konflik Timur Tengah")!;
    assert.equal(conflict.metrics.TV?.exposure, 8);
    assert.equal(conflict.contribution.TV, 28.57);
    assert.equal(clusterMetrics(data.days, "iNews").TV?.duration, 18);
    assert.equal(data.sources[0].coded, 3);
    assert.equal(contentComparison(data.days, "TV", "iNews").find((row) => row.topic === "Ijazah Gibran")?.gap, (5 + 6) / 2 - 4);
  });
});
