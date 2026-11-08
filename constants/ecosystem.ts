import { channels } from "./navigation";

// Digital reach is a separate demo fixture: these platforms are absent from RAW INEWS.xlsx.
export const platforms = [
  "Instagram",
  "Facebook",
  "YouTube",
  "Video",
  "Website",
  "TikTok",
] as const;
const baseline = [18400000, 12100000, 24600000, 8100000, 15700000, 21400000];

export const ecosystemData = Array.from({ length: 38 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, 1 + index * 7));
  return channels.flatMap((channel, channelIndex) =>
    platforms.map((platform, platformIndex) => ({
      Year: 2026,
      Month: date.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
      Week: index + 1,
      Date: date.toISOString().slice(0, 10),
      Channel: channel,
      Platform: platform,
      Reach: Math.round(
        baseline[platformIndex] *
          (1 - channelIndex * 0.17) *
          (0.7 + index * 0.012 + Math.sin(index * 0.9 + platformIndex) * 0.08),
      ),
    })),
  );
}).flat();
