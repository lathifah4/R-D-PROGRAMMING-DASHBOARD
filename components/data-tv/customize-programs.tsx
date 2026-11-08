"use client";

import { useId, useMemo, useRef, useState, type DragEvent } from "react";
import { DotsSixVerticalIcon, GearSixIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { tvProgramAirings, tvProgramChannels, type TvDataset } from "@/lib/tv-data";
import {
  customizeTvPrograms, filterTvPrograms, tvColumnOrder, tvProgramSummary,
  TV_CUSTOM_COLUMNS, TV_CUSTOM_HIDDEN, TV_CUSTOM_LABELS, type TvCustomColumn, type TvProgramGrouping,
} from "@/lib/tv-customize";
import { displayDate, number } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomizeDateDialog } from "./customize-date-dialog";
import { TvChannelFilter } from "./tv-filters";

type Keyword = { mode: "include" | "exclude"; text: string };
type Selection = { channels: string[]; dates: string[]; keywords: Keyword[] };
type Options = { order: TvCustomColumn[]; hidden: TvCustomColumn[]; grouping: TvProgramGrouping; summaryChannels: boolean; summaryColumns: boolean };
const storageKey = "inews-customize-columns-v2";
const metrics = ["TVR", "Share", "Audience"] as const;
const groupings = [{ value: "date", label: "Tanggal" }, { value: "week", label: "Week" }, { value: "month", label: "Bulan" }, { value: "program", label: "Program (total)" }] as const;
function readOptions(): Options {
  const defaults: Options = { order: [...TV_CUSTOM_COLUMNS], hidden: [...TV_CUSTOM_HIDDEN], grouping: "date", summaryChannels: true, summaryColumns: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!saved || typeof saved !== "object") return defaults;
    const hidden = Array.isArray(saved.hidden) ? TV_CUSTOM_COLUMNS.filter((key) => saved.hidden.includes(key)) : defaults.hidden;
    return { order: tvColumnOrder(saved.order), hidden: hidden.length === TV_CUSTOM_COLUMNS.length ? defaults.hidden : hidden,
      grouping: groupings.some((group) => group.value === saved.grouping) ? saved.grouping : "date",
      summaryChannels: saved.summaryChannels !== false, summaryColumns: saved.summaryColumns !== false };
  } catch { return defaults; }
}

export function CustomizePrograms({ data }: { data: TvDataset }) {
  const source = useMemo(() => tvProgramAirings(data.airings.filter((row) => !row.paytv)), [data.airings]);
  const availableDates = useMemo(() => [...new Set(source.map((row) => row.date))].sort(), [source]);
  const weeks = useMemo(() => new Map(source.map((row) => [row.date, row.week])), [source]);
  const programs = useMemo(() => [...new Set(source.map((row) => row.program))].sort((a, b) => a.localeCompare(b, "id")), [source]);
  const [channels, setChannels] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordDraft, setKeywordDraft] = useState<Keyword[]>([]);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [options, setOptions] = useState<Options>(readOptions);
  const [applied, setApplied] = useState<Selection | null>(null);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: TvCustomColumn; descending: boolean }>({ key: "Period", descending: true });
  const [storageError, setStorageError] = useState(false);
  const keywordList = useId();
  const optionsId = useId();
  const optionsButton = useRef<HTMLButtonElement>(null);
  const { grouping } = options;
  const canRun = channels.length > 0 && keywords.some((keyword) => keyword.text.trim());
  const stale = applied !== null && JSON.stringify(applied) !== JSON.stringify({ channels, dates, keywords });
  const airings = useMemo(() => applied ? filterTvPrograms(source, applied.channels, applied.dates,
    applied.keywords.filter((term) => term.mode === "include").map((term) => term.text),
    applied.keywords.filter((term) => term.mode === "exclude").map((term) => term.text)) : [], [source, applied]);
  const rows = useMemo(() => customizeTvPrograms(airings, grouping), [airings, grouping]);
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const left = a[sort.key], right = b[sort.key];
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "id", { numeric: true });
    return sort.descending ? -comparison : comparison;
  }), [rows, sort]);
  const visible = options.order.filter((key) => !options.hidden.includes(key));
  const summary = tvProgramSummary(airings);
  const channelSummary = (applied?.channels ?? []).map((channel) => ({ channel, ...tvProgramSummary(airings.filter((row) => row.channel === channel)) }));
  const missingChannels = (applied?.channels ?? []).filter((channel) => !source.some((row) => row.channel === channel));
  const pageCount = Math.max(1, Math.ceil(sorted.length / 50));
  const currentPage = Math.min(page, pageCount - 1);
  function saveOptions(next: Options) {
    setOptions(next);
    setPage(0);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  function moveColumn(key: TvCustomColumn, target: TvCustomColumn) {
    if (key === target) return;
    const order = options.order.filter((item) => item !== key);
    order.splice(options.order.indexOf(target), 0, key);
    saveOptions({ ...options, order });
  }
  const dropColumn = (event: DragEvent, target: TvCustomColumn) => {
    event.preventDefault();
    const source = event.dataTransfer.getData("text/plain") as TvCustomColumn;
    if (TV_CUSTOM_COLUMNS.includes(source)) moveColumn(source, target);
  };
  const value = (key: TvCustomColumn, cell: string | number | null) => {
    if (cell === null || cell === "") return "–";
    if (typeof cell === "number") return number(cell, key === "Airings" || key === "Counter" ? 0 : 2);
    return key === "Period" && grouping === "date" ? displayDate(cell) : cell;
  };
  return <section className="builder-panel tv-customize-panel" aria-label="Customize program">
    <div className="builder-filter-rail tv-custom-filters" role="region" aria-label="Filter Customize">
      <div className="tv-filter tv-custom-keyword-filter">
        <span className="tv-filter-label">Kata kunci</span>
        <Dialog open={keywordsOpen} onOpenChange={(open) => {
          setKeywordsOpen(open);
          if (open) setKeywordDraft(Array.from({ length: Math.max(6, keywords.length) }, (_, index) => keywords[index] ? { ...keywords[index] } : { mode: "include", text: "" }));
        }}>
          <DialogTrigger render={<button type="button" className="tv-custom-select" aria-label="Pilih kata kunci program" />}>
            <span>{keywords.length ? keywords.map((row) => `${row.mode === "exclude" ? "− " : ""}${row.text}`).join(", ") : "Pilih kata kunci"}</span><span aria-hidden="true">▾</span>
          </DialogTrigger>
          <DialogContent className="tv-custom-dialog tv-keyword-dialog" showCloseButton={false}>
            <DialogHeader className="tv-custom-dialog-header">
              <DialogTitle>Kata kunci program</DialogTitle>
              <DialogDescription className="sr-only">Masukkan kata kunci dan pilih Include atau Exclude. Simpan dengan OK, atau batalkan dengan Cancel.</DialogDescription>
              <DialogClose className="tv-custom-close" aria-label="Tutup kata kunci">×</DialogClose>
            </DialogHeader>
            <form onSubmit={(event) => {
              event.preventDefault();
              setKeywords(keywordDraft.map((row) => ({ ...row, text: row.text.trim() })).filter((row) => row.text));
              setKeywordsOpen(false);
            }}>
              <div className="tv-custom-dialog-body">
                <div className="tv-keyword-table-wrap"><table className="tv-keyword-table">
                  <thead><tr><th scope="col">Description</th><th scope="col">Include</th><th scope="col"><span className="sr-only">Hapus</span></th></tr></thead>
                  <tbody>{keywordDraft.map((row, index) => <tr key={index}>
                    <td><input list={keywordList} aria-label={`Kata kunci ${index + 1}`} value={row.text} placeholder="ketik nama program..."
                      onChange={(event) => setKeywordDraft(keywordDraft.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} /></td>
                    <td><select aria-label={`Jenis kata kunci ${index + 1}`} value={row.mode}
                      onChange={(event) => setKeywordDraft(keywordDraft.map((item, i) => i === index ? { ...item, mode: event.target.value as Keyword["mode"] } : item))}>
                      <option value="include">Include</option><option value="exclude">Exclude</option>
                    </select></td>
                    <td><button type="button" className="tv-keyword-remove" aria-label={`Hapus kata kunci ${index + 1}`} onClick={() => setKeywordDraft(keywordDraft.filter((_, i) => i !== index))}>×</button></td>
                  </tr>)}</tbody>
                </table></div>
                <datalist id={keywordList}>{programs.map((program) => <option key={program} value={program} />)}</datalist>
                <button type="button" className="tv-custom-text-button" onClick={() => setKeywordDraft([...keywordDraft, { mode: "include", text: "" }])}>+ Tambah baris</button>
                <p className="tv-keyword-help"><strong>Include</strong> = program yang namanya mengandung teks ini ikut dicari (boleh beberapa baris). <strong>Exclude</strong> = program yang mengandung teks ini dibuang, mis. <strong>(R)</strong> untuk rerun. Huruf besar/kecil tidak berpengaruh.</p>
              </div>
              <div className="tv-custom-dialog-footer"><button type="submit" className="tv-custom-confirm">OK</button><DialogClose className="tv-custom-cancel">Cancel</DialogClose></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <TvChannelFilter channels={tvProgramChannels(data)} selected={channels} onChange={setChannels} searchable />
      <CustomizeDateDialog dates={dates} availableDates={availableDates} weeks={weeks} onChange={setDates} />
      <button type="button" className="tv-custom-run" disabled={!canRun} onClick={() => { setApplied({ channels: [...channels], dates: [...dates], keywords: keywords.map((row) => ({ ...row })) }); setPage(0); }}><MagnifyingGlassIcon size={18} aria-hidden="true" /> Run</button>
      <button ref={optionsButton} type="button" className="tv-custom-options-toggle" aria-expanded={optionsOpen} aria-controls={optionsId} onClick={() => setOptionsOpen(!optionsOpen)}><GearSixIcon size={15} aria-hidden="true" /> Opsi Tabel <span aria-hidden="true">▾</span></button>
    </div>
    <div className={`tv-custom-body${optionsOpen ? " has-options" : ""}`}>
      <div className="tv-custom-results">
        {!applied ? <div className="tv-custom-empty" role="status">
          <p>Pilih kata kunci (Include / Exclude), centang channel tempat program itu dicari, pilih tanggal (boleh dikosongkan = semua tanggal), lalu klik <strong>Run</strong>.</p>
          <ul><li data-ready={keywords.length > 0}>Kata kunci</li><li data-ready={channels.length > 0}>Channel</li><li data-ready={dates.length > 0}>Tanggal: {dates.length ? `${dates.length} dipilih` : "Semua tanggal"}</li><li>Klik Run</li></ul>
          <p>Contoh: Include <strong>BERSUARA</strong>, Exclude <strong>(R)</strong> + centang INEWS (dan TVONE)</p>
        </div> : <>
          {stale && <p className="tv-stale" role="status">Filter berubah, klik <strong>Run</strong> untuk memperbarui hasil.</p>}
          {missingChannels.length > 0 && <p className="builder-callout" role="status">Data program belum tersedia di sumber untuk {missingChannels.join(", ")}.
            {data.missing.includes("Program Detail Others") && " Sheet Program Detail Others belum tersedia."}</p>}
          <p className="tv-note">{number(rows.length)} baris · {number(airings.length)} penayangan · {applied.dates.length ? `${applied.dates.length} tanggal terpilih` : "Semua tanggal"}.
            {" "}{applied.keywords.map((term) => `${term.mode === "include" ? "Include" : "Exclude"}: ${term.text}`).join(" · ")}</p>
          <div className="tv-table-scroll" tabIndex={0} role="region" aria-label="Tabel Customize">
            <table className="tv-table tv-custom-table"><thead><tr>{visible.map((key) => <th key={key} scope="col" draggable
              aria-sort={sort.key === key ? sort.descending ? "descending" : "ascending" : "none"}
              onDragStart={(event) => { event.dataTransfer.setData("text/plain", key); event.dataTransfer.effectAllowed = "move"; }}
              onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropColumn(event, key)}>
              <button type="button" onClick={() => { setSort({ key, descending: sort.key === key ? !sort.descending : true }); setPage(0); }}>{TV_CUSTOM_LABELS[key]}{sort.key === key ? sort.descending ? " ▼" : " ▲" : ""}</button>
            </th>)}</tr></thead>
              <tbody>{sorted.length ? sorted.slice(currentPage * 50, (currentPage + 1) * 50).map((row, index) => <tr key={JSON.stringify([row.Channel, row.Program, row.Period])} className={applied.channels.length > 1 && row.Channel === "INEWS" ? "is-highlighted" : ""}>
                {visible.map((key) => <td key={key}>{value(key, key === "Counter" ? currentPage * 50 + index + 1 : row[key])}</td>)}
              </tr>) : <tr><td colSpan={visible.length}>Tidak ada program yang cocok dengan filter.</td></tr>}</tbody>
              {options.summaryColumns && airings.length > 0 && <tfoot>
                <tr><th colSpan={visible.length} scope="row">Summary Columns · rata-rata seluruh penayangan terfilter</th></tr>
                <tr aria-label="Summary Columns">{visible.map((key) => <td key={key}>{metrics.includes(key as typeof metrics[number]) ? value(key, summary[key as typeof metrics[number]]) : key === "Airings" ? number(summary.Airings) : ""}</td>)}</tr>
              </tfoot>}
            </table>
          </div>
          {pageCount > 1 && <div className="tv-custom-actions" aria-label="Halaman Customize">
            <Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Sebelumnya</Button><span>{currentPage + 1} / {pageCount}</span>
            <Button variant="outline" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</Button>
          </div>}
          {options.summaryChannels && airings.length > 0 && <div className="tv-table-scroll" tabIndex={0} role="region" aria-label="Summary per channel"><table className="tv-table">
            <caption>Summary per channel · rata-rata seluruh penayangan terpilih</caption>
            <thead><tr><th scope="col">Channel</th><th scope="col">Jumlah tayang</th>{metrics.map((key) => <th scope="col" key={key}>{TV_CUSTOM_LABELS[key]}</th>)}</tr></thead>
            <tbody>{channelSummary.map((row) => <tr key={row.channel}><th scope="row">{row.channel}</th><td>{number(row.Airings)}</td>{metrics.map((key) => <td key={key}>{value(key, row[key])}</td>)}</tr>)}</tbody>
          </table></div>}
        </>}
      </div>
      {optionsOpen && <aside id={optionsId} className="tv-custom-options" aria-label="Opsi Tabel" onKeyDown={(event) => { if (event.key === "Escape") { setOptionsOpen(false); optionsButton.current?.focus(); } }}>
        <div className="tv-custom-options-header"><h2>Opsi Tabel</h2><button type="button" className="tv-custom-close" aria-label="Tutup Opsi Tabel" onClick={() => { setOptionsOpen(false); optionsButton.current?.focus(); }}>×</button></div>
        <fieldset><legend>Baris per</legend>{groupings.map((group) => <label key={group.value}><input type="radio" name="customize-grouping" checked={grouping === group.value} onChange={() => saveOptions({ ...options, grouping: group.value })} />{group.label}</label>)}</fieldset>
        <div className="tv-custom-columns"><h3>Kolom · urutan</h3>
          <ol>{options.order.map((key, index) => <li key={key} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropColumn(event, key)}>
            <DotsSixVerticalIcon size={16} aria-hidden="true" />
            <label><input type="checkbox" checked={!options.hidden.includes(key)} disabled={visible.length === 1 && visible[0] === key}
              onChange={(event) => saveOptions({ ...options, hidden: event.target.checked ? options.hidden.filter((item) => item !== key) : [...options.hidden, key] })} />{TV_CUSTOM_LABELS[key]}</label>
            <div><button type="button" disabled={index === 0} aria-label={`Naikkan kolom ${TV_CUSTOM_LABELS[key]}`} onClick={() => moveColumn(key, options.order[index - 1])}>▲</button>
              <button type="button" disabled={index === options.order.length - 1} aria-label={`Turunkan kolom ${TV_CUSTOM_LABELS[key]}`} onClick={() => moveColumn(key, options.order[index + 1])}>▼</button></div>
          </li>)}</ol>
          <button type="button" className="tv-custom-text-button" onClick={() => saveOptions({ ...options, order: [...TV_CUSTOM_COLUMNS], hidden: [...TV_CUSTOM_HIDDEN] })}>Kembalikan kolom awal</button>
          <p>Atas = paling kiri. Geser baris atau klik ▲▼, atau geser judul kolom langsung di tabel.</p>
        </div>
        <fieldset><legend>Summary</legend>
          <label><input type="checkbox" checked={options.summaryChannels} onChange={(event) => saveOptions({ ...options, summaryChannels: event.target.checked })} />Summary per channel</label>
          <label><input type="checkbox" checked={options.summaryColumns} onChange={(event) => saveOptions({ ...options, summaryColumns: event.target.checked })} />Summary Columns</label>
        </fieldset>
        {storageError && <p role="status">Pengaturan berlaku saat ini, tetapi browser tidak mengizinkan penyimpanan.</p>}
      </aside>}
    </div>
  </section>;
}
