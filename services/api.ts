import type { DataRow } from "@/lib/dashboard-data";
import type { SheetEndpoint } from "@/lib/spreadsheet-data";
import type { ContentDataset } from "@/lib/content-data";
import type { TvDataset } from "@/lib/tv-data";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Gagal memuat data (${response.status}).`,
    );
  }
  return response.json();
}

function getSheet(endpoint: SheetEndpoint, signal?: AbortSignal) {
  return getJson<DataRow[]>(`/api/spreadsheet/${endpoint}`, signal);
}

export function GetContent(signal?: AbortSignal) {
  return getJson<ContentDataset>("/api/content", signal);
}

export function GetDataTv(signal?: AbortSignal) {
  return getJson<TvDataset>("/api/data-tv", signal);
}

export async function GetPerformanceMonthly(signal?: AbortSignal) {
  return getSheet("performance-monthly", signal);
}
export async function GetPerformanceWeekly(signal?: AbortSignal) {
  return getSheet("performance-weekly", signal);
}
export async function GetDaypartWeekly(signal?: AbortSignal) {
  return getSheet("daypart-weekly", signal);
}
export async function GetTrend(signal?: AbortSignal) {
  return getSheet("trend", signal);
}
export async function GetProgramDetail(signal?: AbortSignal) {
  return getSheet("program-detail", signal);
}
export async function GetBulletin(signal?: AbortSignal) {
  return getSheet("bulletin", signal);
}
export async function GetAgendaSetting(signal?: AbortSignal) {
  return getSheet("agenda-setting", signal);
}
export async function GetTalkshow(signal?: AbortSignal) {
  return getSheet("talkshow", signal);
}
export async function GetNarasumberTalkshow(signal?: AbortSignal) {
  return getSheet("narasumber-talkshow", signal);
}
export async function GetPromoDaily(signal?: AbortSignal) {
  return getSheet("promo-daily", signal);
}
export async function GetPromo(signal?: AbortSignal) {
  return getSheet("promo", signal);
}
export async function GetCommercial(signal?: AbortSignal) {
  return getSheet("commercial", signal);
}
export async function GetCommercialDaily(signal?: AbortSignal) {
  return getSheet("commercial-daily", signal);
}
export async function GetAdvertiser(signal?: AbortSignal) {
  return getSheet("advertiser", signal);
}

export const sheetServices = {
  "performance-monthly": GetPerformanceMonthly,
  "performance-weekly": GetPerformanceWeekly,
  "daypart-weekly": GetDaypartWeekly,
  trend: GetTrend,
  "program-detail": GetProgramDetail,
  bulletin: GetBulletin,
  "agenda-setting": GetAgendaSetting,
  talkshow: GetTalkshow,
  "narasumber-talkshow": GetNarasumberTalkshow,
  "promo-daily": GetPromoDaily,
  promo: GetPromo,
  commercial: GetCommercial,
  "commercial-daily": GetCommercialDaily,
  advertiser: GetAdvertiser,
} satisfies Record<SheetEndpoint, (signal?: AbortSignal) => Promise<DataRow[]>>;
