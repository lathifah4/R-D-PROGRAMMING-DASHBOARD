"use client";

import { Fragment, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetContent } from "@/services/api";
import { contentCodingStatus } from "@/lib/content-data";
import { displayDate, number } from "@/lib/dashboard-data";

export function ContentCodingStatus() {
  const { data } = useQuery({
    queryKey: ["content", "published-methodology-v3"],
    retry: 2,
    queryFn: ({ signal }) => GetContent(signal),
  });
  const status = useMemo(() => contentCodingStatus(data?.days ?? []), [data]);
  if (!data?.days.length) return null;

  return <li aria-label="Status kelengkapan coding">
    <strong>Status data:</strong> Cakupan sumber saat ini: {displayDate(data.days[0].date)} – {displayDate(data.days.at(-1)!.date)}.
    {" "}Kelengkapan coding seluruh dataset, tetap saat rentang tanggal diubah:{" "}
    {status.map((row, index) => <Fragment key={row.platform}>
      {index > 0 && (index === status.length - 1 ? ", dan " : ", ")}
      <strong>{row.percentage === null ? "belum ada data" : `${number(row.percentage, 0)}%`}</strong>{" "}
      {row.platform} ({number(row.coded)}/{number(row.total)} konten)
    </Fragment>)}.
    {" "}Sisanya dikategorikan Other dan dikecualikan dari matrix.
  </li>;
}
