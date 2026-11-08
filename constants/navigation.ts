export const navigation = [
  { href: "/data-tv", label: "Data TV", description: "Performa channel dan program TV" },
  { href: "/content", label: "Content", description: "Topik lintas platform dan kompetitor" },
] as const;

export const channels = ["INEWS", "TVONE", "KOMPASTV", "METRO", "GTV", "MDTV", "ANTV", "RCTI", "TRANS", "TRANS7", "IVM", "SCTV", "MNCTV", "RTV", "MENTARI", "MOJI", "SINPO", "GARUDATV", "CNN INDONESIA", "NUSANTARATV"] as const;
export type Channel = (typeof channels)[number];

export const channelLabels: Record<Channel, string> = {
  INEWS: "iNews",
  TVONE: "tvOne",
  KOMPASTV: "Kompas TV",
  METRO: "Metro TV",
  GTV: "GTV",
  ANTV: "ANTV",
  RTV: "RTV",
  MENTARI: "Mentari TV",
  MOJI: "Moji",
  SINPO: "Sinpo TV",
  GARUDATV: "Garuda TV",
  "CNN INDONESIA": "CNN Indonesia",
  NUSANTARATV: "Nusantara TV",
  MDTV: "MDTV",
  RCTI: "RCTI",
  TRANS: "TRANS",
  TRANS7: "TRANS7",
  IVM: "IVM",
  SCTV: "SCTV",
  MNCTV: "MNCTV",

};

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const monthLabels = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
