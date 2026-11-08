import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook

from scripts.merge_content import SHEETS, SOURCES, LATEST_SOURCE, merge_content


class MergeContentTest(unittest.TestCase):
    def test_latest_period_replaces_previous_snapshot_and_retains_digital_overflow(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            for index, (filename, _) in enumerate(SOURCES + (LATEST_SOURCE,)):
                book = Workbook()
                book.remove(book.active)
                for name in SHEETS:
                    sheet = book.create_sheet(name)
                    if name == "YOUTUBE":
                        sheet.append(["Content ID", "Upload Date", "Views", "Title"])
                    elif name == "SOCIAL MEDIA":
                        sheet.append(["Platform", "Tanggal", "Views", "Post"])
                    else:
                        sheet.append(["Program", "Date", "Views", "Title"])
                    if index == 2:
                        sheet.append(["old", datetime(2026, 10, 15), 10, "Complete"])
                        sheet.append(["old", datetime(2026, 10, 16), 999, "Snapshot"])
                    if index == 3:
                        sheet.append(["latest", datetime(2026, 10, 16), 20, "Complete"])
                        sheet.append(["latest", datetime(2026, 10, 23 if name in ("YOUTUBE", "SOCIAL MEDIA") else 22), 30, "Last"])
                book.save(folder / filename)
            output = folder / "combined.xlsx"
            summary = merge_content(folder, output)
            book = load_workbook(output, read_only=True, data_only=True)
            try:
                for name in SHEETS:
                    rows = list(book[name].values)[1:]
                    self.assertEqual(len(rows), 3)
                    self.assertNotIn(999, [row[2] for row in rows])
                    self.assertEqual(sum(row[2] for row in rows if row[1].day == 16), 20)
                    self.assertEqual(rows[-1][1].day, 23 if name in ("YOUTUBE", "SOCIAL MEDIA") else 22)
                    self.assertEqual(summary[name]["outside_period"], 1)
            finally:
                book.close()

    def test_merge_periods_headers_and_preserves_distinct_upload_dates(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            for index, (filename, start) in enumerate(SOURCES):
                book = Workbook()
                book.remove(book.active)
                for name in SHEETS:
                    if name == "SINDONEWS" and index == 2:
                        continue
                    sheet = book.create_sheet(name)
                    if name == "YOUTUBE":
                        sheet.append(["Content ID", "Upload Date", "Views", "Title"])
                        sheet.append(["same-video", start.strftime("%d/%m/%Y"), index + 1,
                                      "Video"])
                        if index == 0:
                            sheet.append(["overflow", "01/10/2026", 999, "Overflow"])
                        if index == 2:
                            sheet.append(["same-video", "10/10/2026", 50, "Video berbeda"])
                    elif name == "SOCIAL MEDIA":
                        sheet.append(["Platform", "Tanggal", "Link", "Views", "Akun", "Post"]
                                     + (["Sumber Coding"] if index == 1 else []))
                        sheet.append(["X", datetime.combine(start, datetime.min.time()),
                                      "same-link", index + 1, "iNews", "Post"]
                                     + (["manual"] if index == 1 else []))
                        sheet.append(["Instagram", datetime.combine(start, datetime.min.time()),
                                      None, index + 1, "iNews", "Post"])
                        if index == 2:
                            sheet.append(["X", datetime(2026, 10, 10), "same-link", 50,
                                          "Okezone", "Post"])
                            sheet.append(["X", datetime(2026, 10, 10), "same-link", 60,
                                          "iNews", "Post berbeda"])
                        if index == 0:
                            sheet.append(["TikTok", datetime(2026, 9, 2), "reused-link", 7,
                                          "iNews", "Caption sama"])
                            sheet.append(["TikTok", datetime(2026, 9, 3), "reused-link", 11,
                                          "iNews", "Caption sama"])
                    else:
                        sheet.append(["PROGRAM INEWS" if index < 2 else "PROGRAM TVONE",
                                      "Date", "TEMA "])
                        row = ["Buletin", datetime.combine(start, datetime.min.time()), "Isu"]
                        sheet.append(row)
                        sheet.append(row)
                book.save(folder / filename)

            output = folder / "combined.xlsx"
            summary = merge_content(folder, output)
            book = load_workbook(output, read_only=True, data_only=True)
            self.addCleanup(book.close)
            self.assertEqual(book.sheetnames, list(SHEETS))
            rows = list(book["TVONE"].values)
            self.assertEqual(rows[0], ("Program", "Date", "TEMA", "Source File"))
            self.assertEqual(len(rows), 7)  # Identical TV rows can be legitimate minutes.
            self.assertEqual(summary["SINDONEWS"]["rows"], 4)
            self.assertEqual(summary["SINDONEWS"]["missing_sources"], [SOURCES[2][0]])
            youtube = list(book["YOUTUBE"].values)
            self.assertEqual(len(youtube), 5)
            self.assertEqual(youtube[1][0], "same-video")
            self.assertEqual(youtube[1][2:], (1, "Video", SOURCES[0][0]))
            self.assertIsInstance(youtube[1][1], datetime)
            self.assertEqual([row[1] for row in youtube[1:4]],
                             [datetime(2026, 9, 1), datetime(2026, 10, 1), datetime(2026, 10, 9)])
            self.assertEqual(sum(row[2] for row in youtube[1:]), 56)
            self.assertEqual(summary["YOUTUBE"]["outside_period"], 1)
            self.assertEqual(summary["YOUTUBE"]["duplicates"], 0)
            social = list(book["SOCIAL MEDIA"].values)
            self.assertEqual(len(social), 11)
            tiktok = [row for row in social[1:] if row[0] == "TikTok"]
            self.assertEqual(len(tiktok), 2)
            self.assertEqual(sum(row[3] for row in tiktok), 18)
            self.assertIn("Sumber Coding", social[0])
            self.assertEqual(social[1][3:], (1, "iNews", "Post", None, SOURCES[0][0]))
            self.assertEqual(summary["SOCIAL MEDIA"]["duplicates"], 0)
            with self.assertRaisesRegex(ValueError, "file sumber"):
                merge_content(folder, folder / SOURCES[0][0])
            book.close()


if __name__ == "__main__":
    unittest.main()
