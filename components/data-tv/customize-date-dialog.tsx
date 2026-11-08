"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { tvCalendarMonths, tvCalendarRange } from "@/lib/tv-customize";
import { displayDate } from "@/lib/dashboard-data";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export function CustomizeDateDialog({ dates, availableDates, weeks, onChange }: {
  dates: string[];
  availableDates: string[];
  weeks: Map<string, number>;
  onChange: (dates: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const anchor = useRef<string | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const months = useMemo(() => tvCalendarMonths(availableDates), [availableDates]);
  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const selected = new Set(draft);
  const rangeInvalid = !!from && !!to && from > to;
  function toggle(values: string[]) {
    const eligible = values.filter((date) => available.has(date) && days.includes(weekday(date)));
    const remove = eligible.every((date) => selected.has(date));
    setDraft(remove ? draft.filter((date) => !eligible.includes(date)) : [...new Set([...draft, ...eligible])].sort());
  }
  return <div className="tv-filter tv-custom-date-filter">
    <span className="tv-filter-label">Tanggal</span>
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (value) { setDraft([...dates]); setDays([0, 1, 2, 3, 4, 5, 6]); setFrom(""); setTo(""); anchor.current = null; }
    }}>
      <DialogTrigger render={<button type="button" className="tv-custom-select" aria-label="Pilih tanggal Customize" />}>
        <span>{dates.length ? `${dates.length} tanggal dipilih` : "Semua tanggal"}</span>
        <CalendarBlankIcon size={16} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="tv-custom-dialog tv-calendar-dialog" showCloseButton={false} initialFocus={title}>
        <DialogHeader className="tv-custom-dialog-header">
          <DialogTitle ref={title} tabIndex={-1}>Tanggal</DialogTitle>
          <DialogDescription className="sr-only">Pilih tanggal, week, bulan, atau tambah rentang. Simpan dengan OK, atau batalkan dengan Cancel.</DialogDescription>
          <DialogClose className="tv-custom-close" aria-label="Tutup kalender">×</DialogClose>
        </DialogHeader>
        <div className="tv-calendar-layout">
          <div className="tv-calendar-main">
            <div className="tv-calendar-weekdays" role="group" aria-label="Pilih hanya hari">
              <span>Pilih hanya:</span>
              <div>{weekdays.map((label, day) => <button key={label} type="button" aria-pressed={days.includes(day)}
                disabled={days.length === 1 && days.includes(day)} onClick={() => {
                  const next = days.includes(day) ? days.filter((value) => value !== day) : [...days, day];
                  setDays(next);
                  setDraft(availableDates.filter((date) => next.includes(weekday(date))));
                }}>{label}</button>)}</div>
            </div>
            <div className="tv-calendar-months" aria-label="Kalender tanggal program">
              {months.map((month) => <table className="tv-calendar-month" key={month.key}>
                <caption><button type="button" aria-label={`Pilih bulan ${month.label}`} onClick={() => toggle(availableDates.filter((date) => date.startsWith(month.key)))}>{month.label}</button></caption>
                <thead><tr><th scope="col"><span className="sr-only">Week</span></th>{weekdays.map((day, index) => <th scope="col" className={index === 0 || index === 6 ? "is-weekend" : ""} key={day}>{day.slice(0, 2)}</th>)}</tr></thead>
                <tbody>{month.weeks.map((week) => {
                  const first = week.find((date) => available.has(date));
                  const sourceWeek = first ? weeks.get(first) : undefined;
                  return <tr key={week[0]}>
                    <th scope="row"><button type="button" disabled={!first} aria-label={`Pilih week ${sourceWeek ?? ""}, ${month.label}`}
                      onClick={() => toggle(week)}>{sourceWeek ?? ""}</button></th>
                    {week.map((date, day) => <td key={date} className={day === 0 || day === 6 ? "is-weekend" : ""}>
                      <button type="button" disabled={!available.has(date) || !date.startsWith(month.key) || !days.includes(day)}
                        aria-label={`Pilih ${displayDate(date)}`} aria-pressed={selected.has(date)}
                        className={date.startsWith(month.key) ? "" : "is-other-month"}
                        onClick={(event) => {
                          if (event.shiftKey && anchor.current) {
                            const [start, end] = [anchor.current, date].sort();
                            const range = tvCalendarRange(availableDates, start, end).filter((value) => days.includes(weekday(value)));
                            setDraft([...new Set([...draft, ...range])].sort());
                          } else toggle([date]);
                          anchor.current = date;
                        }}>{Number(date.slice(8))}</button>
                    </td>)}
                  </tr>;
                })}</tbody>
              </table>)}
              {!months.length && <p>Belum ada tanggal program pada sumber.</p>}
            </div>
          </div>
          <aside className="tv-calendar-sidebar" aria-label="Pilihan tanggal">
            <h3>Tambah rentang</h3>
            <form onSubmit={(event) => {
              event.preventDefault();
              const range = tvCalendarRange(availableDates, from, to).filter((date) => days.includes(weekday(date)));
              setDraft([...new Set([...draft, ...range])].sort());
            }}>
              <label>Dari <input type="date" value={from} min={availableDates[0]} max={availableDates.at(-1)} onChange={(event) => setFrom(event.target.value)} /></label>
              <label>Sampai <input type="date" value={to} min={availableDates[0]} max={availableDates.at(-1)} onChange={(event) => setTo(event.target.value)} /></label>
              {rangeInvalid && <p role="alert">Tanggal akhir harus sesudah atau sama dengan tanggal awal.</p>}
              <button type="submit" disabled={!from || !to || rangeInvalid}>Tambah</button>
            </form>
            <div className="tv-calendar-actions">
              <button type="button" onClick={() => setDraft(availableDates.filter((date) => days.includes(weekday(date))))}>Semua</button>
              <button type="button" onClick={() => { setDraft([]); setDays([0, 1, 2, 3, 4, 5, 6]); anchor.current = null; }}>Hapus semua</button>
            </div>
            <h3>Pilihan saat ini</h3>
            <div className="tv-calendar-selection" aria-live="polite">
              {draft.length ? <ul>{draft.map((date) => <li key={date}><span>{displayDate(date)}</span><button type="button" aria-label={`Hapus tanggal ${displayDate(date)}`} onClick={() => setDraft(draft.filter((value) => value !== date))}>×</button></li>)}</ul>
                : <p>Belum ada. Kosong = semua tanggal.</p>}
            </div>
            <p className="tv-calendar-help">Klik tanggal = pilih / batal. Shift + klik = rentang dari klik sebelumnya. Klik nomor week atau nama bulan = pilih satu week / bulan. Kosong = semua tanggal.</p>
          </aside>
        </div>
        <div className="tv-custom-dialog-footer">
          <button type="button" className="tv-custom-confirm" onClick={() => { onChange(draft); setOpen(false); }}>OK</button>
          <DialogClose className="tv-custom-cancel">Cancel</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
