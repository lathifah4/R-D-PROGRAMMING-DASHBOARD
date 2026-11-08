"""Gabungkan workbook Content di public menjadi satu Excel enam tab.

Kebutuhan: python -m pip install openpyxl
Jalankan: python scripts/merge_content.py
Output: public/Database All Platform Combined.xlsx
Lokasi lain: python scripts/merge_content.py --output hasil/content.xlsx

Periode lama dipotong pada awal periode berikutnya. Konten digital yang
berulang antarfile memakai salinan terbaru, dengan tanggal, akun/cluster, dan
teks yang sama. Baris berulang di dalam satu file dipertahankan seperti sumber.
Nilai topik/coding dipertahankan; script ini tidak melakukan pemetaan topik.
"""

import argparse
from contextlib import ExitStack
from datetime import date, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile

from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    ("Database All Platform Sept 2026.xlsx", date(2026, 9, 1)),
    ("Database All Platform 01 - 08 Oct 2026.xlsx", date(2026, 10, 1)),
    ("Database All Platform 09 - 15 Oct 2026.xlsx", date(2026, 10, 9)),
)
LATEST_SOURCE = ("Database All Platform 16 - 22 Oct 2026.xlsx", date(2026, 10, 16))
SHEETS = ("INEWS", "TVONE", "KOMPAS", "SINDONEWS", "YOUTUBE", "SOCIAL MEDIA")


def headers_for(sheet):
    headers = [str(value).strip() if value is not None else ""
               for value in next(sheet.iter_rows(max_row=1, values_only=True))]
    if headers[0].upper().startswith("PROGRAM"):
        headers[0] = "Program"
    if not all(headers) or len(set(headers)) != len(headers):
        raise ValueError(f"Header kosong/duplikat pada sheet {sheet.title}")
    return headers


def row_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.strptime(str(value).strip(), "%d/%m/%Y").date()


def merge_content(input_dir, output):
    input_dir, output = Path(input_dir), Path(output).resolve()
    sources = SOURCES + ((LATEST_SOURCE,) if (input_dir / LATEST_SOURCE[0]).exists() else ())
    paths = [input_dir / name for name, _ in sources]
    if output in [path.resolve() for path in paths]:
        raise ValueError("Output tidak boleh menimpa file sumber.")

    result = Workbook(write_only=True)
    summary = {}
    with ExitStack() as stack:
        books = []
        for path in paths:
            book = load_workbook(path, read_only=True, data_only=True)
            stack.callback(book.close)
            missing = set(SHEETS) - set(book.sheetnames)
            if missing - {"SINDONEWS"}:
                raise ValueError(f"{path.name}: sheet tidak tersedia: {sorted(missing)}")
            books.append(book)

        for name in SHEETS:
            schemas = [headers_for(book[name]) if name in book.sheetnames else []
                       for book in books]
            headers = list(dict.fromkeys(key for schema in schemas for key in schema))
            target = result.create_sheet(name)
            target.freeze_panes = "A2"
            target.append(headers + ["Source File"])
            stats = {"rows": 0, "outside_period": 0, "duplicates": 0,
                     "missing_sources": []}
            digital_rows = {}

            for index, (book, schema) in enumerate(zip(books, schemas)):
                filename, start = sources[index]
                end = sources[index + 1][1] if index + 1 < len(sources) else None
                if not schema:
                    stats["missing_sources"].append(filename)
                    continue
                date_key = next(key for key in schema
                                if key.upper() in ("DATE", "TANGGAL", "UPLOAD DATE"))
                for number, values in enumerate(
                    book[name].iter_rows(min_row=2, values_only=True), 2
                ):
                    if all(value is None for value in values):
                        continue
                    record = dict(zip(schema, values))
                    try:
                        day = row_date(record[date_key])
                    except (ValueError, TypeError) as error:
                        raise ValueError(
                            f"{filename} / {name} / baris {number}: tanggal tidak valid "
                            f"{record[date_key]!r}"
                        ) from error
                    if day < start or (end is not None and day >= end):
                        stats["outside_period"] += 1
                        continue
                    if isinstance(record[date_key], str):
                        record[date_key] = datetime.combine(day, datetime.min.time())
                    row = [record.get(key) for key in headers] + [filename]
                    identity = None
                    # ID/link yang sama pada tanggal berbeda bukan snapshot hari yang sama.
                    if name == "YOUTUBE" and record.get("Content ID"):
                        identity = (day, record.get("Cluster"),
                                    str(record["Content ID"]).strip(), record.get("Title"))
                    elif name == "SOCIAL MEDIA" and record.get("Link"):
                        identity = (day, str(record["Platform"]).strip(), record.get("Akun"),
                                    str(record["Link"]).strip(), record.get("Post"))
                    if name in ("YOUTUBE", "SOCIAL MEDIA"):
                        key = identity if identity is not None else (index, number)
                        previous = digital_rows.get(key)
                        if previous is None or previous[0] != index:
                            if previous is not None:
                                stats["duplicates"] += len(previous[1])
                            previous = (index, [])
                            digital_rows[key] = previous
                        previous[1].append(row)
                    else:
                        target.append(row)
                        stats["rows"] += 1

            for _, rows in digital_rows.values():
                for row in rows:
                    target.append(row)
                    stats["rows"] += 1
            target.auto_filter.ref = (
                f"A1:{get_column_letter(len(headers) + 1)}{stats['rows'] + 1}"
            )
            summary[name] = stats

        output.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(dir=output.parent, suffix=".xlsx", delete=False) as file:
            temporary = Path(file.name)
        try:
            result.save(temporary)
            temporary.replace(output)
        finally:
            temporary.unlink(missing_ok=True)
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path,
                        default=ROOT / "public/Database All Platform Combined.xlsx")
    args = parser.parse_args()
    if not (ROOT / "public" / LATEST_SOURCE[0]).exists():
        print(f"CATATAN: {LATEST_SOURCE[0]} belum tersedia; cakupan mengikuti file sumber yang ada.")
    summary = merge_content(ROOT / "public", args.output)
    for name, stats in summary.items():
        print(f"{name}: {stats['rows']:,} baris; "
              f"di luar periode: {stats['outside_period']:,}; "
              f"duplikat digital: {stats['duplicates']:,}")
        for source in stats["missing_sources"]:
            print(f"  CATATAN: sheet {name} tidak tersedia di {source}.")
    print(f"Output: {args.output.resolve()}")


if __name__ == "__main__":
    main()
