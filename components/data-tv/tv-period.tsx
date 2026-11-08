"use client";

import { createContext, useContext, useEffect } from "react";

export const TvPeriodContext = createContext<
  (section: string, period: string) => void
>(() => {});

export function TvResultPeriod({
  section,
  period,
}: {
  section: string;
  period: string;
}) {
  const report = useContext(TvPeriodContext);
  useEffect(() => {
    report(section, period);
    return () => report(section, "");
  }, [report, section, period]);
  return null;
}
