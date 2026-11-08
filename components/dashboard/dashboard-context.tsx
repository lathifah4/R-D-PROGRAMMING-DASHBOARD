"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  DEFAULT_FILTERS,
  getRows,
  type DataRow,
  type Filters,
} from "@/lib/dashboard-data";
import {
  spreadsheetSheets,
  type SheetEndpoint,
  type SheetName,
  type SpreadsheetData,
} from "@/lib/spreadsheet-data";
import { sheetServices } from "@/services/api";
import { Button } from "@/components/ui/button";

export const dashboardEndpoints: Record<string, SheetEndpoint[]> = {
  "/channel": [
    "trend",
    "program-detail",
    "daypart-weekly",
    "promo-daily",
    "commercial-daily",
  ],
  "/ecosystem": ["trend"],
  "/program": ["program-detail", "talkshow"],
  "/big-topics": ["agenda-setting"],
  "/sales-layer": ["promo-daily", "commercial-daily", "advertiser"],
  "/custom": ["program-detail", "talkshow", "narasumber-talkshow"],
};

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  const createClient = () =>
    new QueryClient({
      defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
    });
  if (typeof window === "undefined") return createClient();
  return (browserQueryClient ??= createClient());
}

const DashboardContext = createContext<{
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  sheets: SpreadsheetData;
  getRows: (sheet: SheetName, filters: Filters) => DataRow[];
  hasData: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
  period: string;
  setPeriod: (period: string) => void;
} | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <DashboardDataProvider>{children}</DashboardDataProvider>
    </QueryClientProvider>
  );
}

function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [period, setPeriod] = useState("");
  const pathname = usePathname();
  const endpoints = dashboardEndpoints[pathname] ?? [];
  const queries = useQueries({
    queries: endpoints.map((endpoint) => ({
      queryKey: [endpoint],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        sheetServices[endpoint](signal),
    })),
  });
  const sheets: SpreadsheetData = {};
  endpoints.forEach((endpoint, index) => {
    sheets[spreadsheetSheets[endpoint].name] = queries[index].data;
  });
  return (
    <DashboardContext.Provider
      value={{
        period,
        setPeriod,
        filters,
        sheets,
        getRows: (sheet, selectedFilters) =>
          getRows(sheets[sheet] ?? [], selectedFilters),
        hasData: queries.every((query) => query.data !== undefined),
        isFetching: queries.some((query) => query.isFetching),
        error: queries.find((query) => query.error)?.error ?? null,
        refetch: () => {
          queries.forEach((query) => {
            void query.refetch();
          });
        },
        updateFilter: (key, value) =>
          setFilters((previous) => ({
            ...previous,
            [key]: value,
            ...(key === "month" ? { week: "all" } : {}),
          })),
        resetFilters: () => setFilters(DEFAULT_FILTERS),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("DashboardProvider is required");
  return context;
}

export function DashboardDataBoundary({ children }: { children: ReactNode }) {
  const { hasData, isFetching, error, refetch } = useDashboard();
  if (error && !hasData) {
    return (
      <div
        className="flex min-h-45 flex-col items-center justify-center gap-2.5 px-5 py-9 text-center text-zinc-500"
        role="alert"
      >
        <h2 className="text-xs font-medium text-zinc-800">
          Data gagal dimuat
        </h2>

        <Button className="mt-1" disabled={isFetching} onClick={refetch}>
          {isFetching ? "Memuat ulang…" : "Coba lagi"}
        </Button>
      </div>
    );
  }
  if (!hasData) {
    return (
      <div
        className="flex min-h-100 items-center justify-center gap-3"
        role="status"
      >
        <span className="loader " aria-hidden="true" />
      </div>
    );
  }
  return (
    <>
      {error ? (
        <p
          className="mx-6 mt-3 mb-5 text-3xs leading-relaxed text-zinc-500 "
          role="alert"
        >
          Pembaruan gagal
        </p>
      ) : isFetching ? (
        <p
          className="mx-6 mt-3 mb-5 text-3xs leading-relaxed text-zinc-500 "
          role="status"
        >
          Memperbarui data…
        </p>
      ) : null}
      {children}
    </>
  );
}
