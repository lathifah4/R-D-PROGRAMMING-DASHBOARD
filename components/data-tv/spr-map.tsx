"use client";

import { sprBlocks, type TvDataset, type TvAiring } from "@/lib/tv-data";
import { displayDate, number } from "@/lib/dashboard-data";

const colors: Record<string, [string, string]> = {
  INEWS: ["#c00000", "#fff"],
  TVONE: ["#0070c0", "#fff"],
  KOMPASTV: ["#00b0f0", "#000"],
  METRO: ["#ffc000", "#000"],
  "SINDONEWS TV": ["#1f3a93", "#fff"],
  "IDX CHANNEL": ["#00843d", "#fff"],
};
const metric = (value: number | null) =>
  value == null ? "N/A" : String(Number(value.toFixed(2)));
const time = (minute: number) =>
  `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(
      /(^|[^a-z])([a-z])/g,
      (_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
    );

export default function SprMap({
  data,
  airings,
  columns,
  paytv = false,
}: {
  data: TvDataset;
  airings: TvAiring[];
  columns: { date: string; channel: string }[];
  paytv?: boolean;
}) {
  const lastColumn = columns.length + 2;
  return (
    <div
      className="spr-scroll tv-spr-scroll"
      tabIndex={0}
      role="region"
      aria-label={
        paytv
          ? "Rating Map Pay TV, gulir untuk jadwal lengkap"
          : "Rating Map FTA, gulir untuk jadwal lengkap"
      }
    >
      <div
        className={`tv-spr-grid${paytv ? " is-paytv" : ""}`}
        style={{
          gridTemplateColumns: `60px repeat(${columns.length}, minmax(${paytv ? 150 : 165}px, 1fr)) 60px`,
          gridTemplateRows: `${paytv ? 78 : 68}px repeat(288, 12px)`,
        }}
      >
        {[1, lastColumn].map((column) => (
          <div
            key={column}
            className={`tv-spr-time-heading ${column === 1 ? "is-left" : "is-right"}`}
            style={{ gridColumn: column, gridRow: 1 }}
          >
            <span />
            <b>Time</b>
          </div>
        ))}
        {columns.map((column, index) => {
          const value = (paytv ? data.paytvDaily : data.daily).find(
            (row) => row.key === column.date,
          )?.shares[column.channel];
          const color = colors[column.channel] ?? ["#bfbfbf", "#000"];
          return (
            <div
              key={`${column.date}-${column.channel}`}
              className="tv-spr-channel"
              style={{ gridColumn: index + 2, gridRow: 1 }}
            >
              <div
                className="tv-spr-share"
                title={`Share harian ${column.channel}`}
              >
                {value == null ? "N/A" : value.toFixed(2)}
              </div>
              <div
                className="tv-spr-channel-name"
                style={{ backgroundColor: color[0], color: color[1] }}
              >
                {paytv ? (
                  <>
                    {displayDate(column.date).replace(/ \d{4}$/, "")}
                    <small>
                      {new Date(`${column.date}T00:00:00Z`).toLocaleDateString(
                        "id-ID",
                        { weekday: "long", timeZone: "UTC" },
                      )}
                    </small>
                  </>
                ) : (
                  column.channel
                )}
              </div>
            </div>
          );
        })}
        {[1, lastColumn].flatMap((column) =>
          Array.from({ length: 48 }, (_, index) => (
            <div
              key={`${column}-${index}`}
              className={`tv-spr-ruler ${column === 1 ? "is-left" : "is-right"}`}
              style={{
                gridColumn: column,
                gridRow: `${index * 6 + 2} / span 6`,
              }}
            >
              {time(index * 30 + 120)}
            </div>
          )),
        )}
        {columns.map((column, index) => (
          <div
            key={`${column.date}-${column.channel}-column`}
            className="tv-spr-column"
            style={{ gridColumn: index + 2, gridRow: "2 / span 288" }}
          />
        ))}
        {columns.flatMap((column, index) =>
          sprBlocks(
            airings.filter(
              (row) =>
                row.date === column.date && row.channel === column.channel,
            ),
          ).map((block) => {
            const label = titleCase(block.airing.program);
            return (
              <div
                key={`${column.date}-${column.channel}-${block.start}`}
                tabIndex={0}
                title={`${label} · ${block.airing.start} · TVR ${metric(block.airing.rating)} / Share ${metric(block.airing.share)}`}
                aria-label={`${block.airing.start}, ${label}, TVR ${number(block.airing.rating, 2)}, Share ${number(block.airing.share, 2)}`}
                className={`tv-spr-program ${block.span === 1 ? "is-short" : block.span < 6 ? "is-medium" : ""}`}
                style={{
                  gridColumn: index + 2,
                  gridRow: `${block.start + 2} / span ${block.span}`,
                }}
              >
                <span>{label}</span>
                <b>
                  {metric(block.airing.rating)}/{metric(block.airing.share)}
                </b>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
