"""Refresh the bounded dashboard fixture without changing the Excel column names."""
import collections
import json
import pathlib
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
TAG = "{" + NS["s"] + "}"


def read_fixture():
    result = {}
    with zipfile.ZipFile(ROOT / "constants/RAW INEWS.xlsx") as archive:
        strings = []
        for _, element in ET.iterparse(archive.open("xl/sharedStrings.xml")):
            if element.tag == TAG + "si":
                strings.append("".join(t.text or "" for t in element.iter(TAG + "t")))
                element.clear()
        relationships = {
            r.get("Id"): r.get("Target")
            for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        }
        sheets = ET.fromstring(archive.read("xl/workbook.xml")).find("s:sheets", NS)
        for sheet in sheets:
            name = sheet.get("name")
            target = relationships[sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
            target = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            headers, records, counts = {}, [], collections.Counter()
            for _, element in ET.iterparse(archive.open(target)):
                if element.tag != TAG + "row":
                    continue
                cells = {}
                for cell in element:
                    column = re.sub(r"\d", "", cell.get("r", ""))
                    value = cell.find("s:v", NS)
                    kind = cell.get("t")
                    if kind == "s" and value is not None:
                        cells[column] = strings[int(value.text)]
                    elif kind == "inlineStr":
                        cells[column] = "".join(t.text or "" for t in cell.iter(TAG + "t"))
                    elif value is not None and kind == "str":
                        cells[column] = value.text
                    elif value is not None and kind != "e":
                        number = float(value.text)
                        cells[column] = int(number) if number.is_integer() else number
                element.clear()
                if len(cells) < 2:
                    continue
                if not headers:
                    headers = {key: value for key, value in cells.items() if isinstance(value, str) and not value.startswith("#")}
                    continue
                if cells.get("A") in ("Month", "Year", "CHANNEL", "MONTH", "Week"):
                    continue
                record = {label: cells.get(column) for column, label in headers.items()}
                if not any(value is not None for value in record.values()):
                    continue
                channel = record.get("Channel", record.get("CHANNEL", ""))
                week = record.get("Week", record.get("Week Ariana", record.get("ISO Week", record.get("Weekly", ""))))
                bucket = (channel, record.get("Month", record.get("MONTH", "")), week)
                if name in ("Program Detail", "BULLETIN"):
                    bucket += (record.get("Level 1"), record.get("Category"))
                    limit = 3
                elif name in ("DATABASE AGENDA SETTING", "DATABASE TALKSHOW", "NARASUMBER TALKSHOW", "Advertiser"):
                    limit = 12
                else:
                    limit = 10000
                if counts[bucket] < limit:
                    records.append(record)
                    counts[bucket] += 1
            result[name] = records
    return result


if __name__ == "__main__":
    fixture = read_fixture()
    destination = ROOT / "constants/workbook.json"
    destination.write_text(json.dumps(fixture, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for name, rows in fixture.items():
        print(f"{name}: {len(rows)} rows")
    print(f"Fixture: {destination.stat().st_size:,} bytes")
