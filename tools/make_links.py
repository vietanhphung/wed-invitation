#!/usr/bin/env python3
"""Turn a guest list (STT | Họ tên | Xưng Danh) into personal invitation links.

  python3 tools/make_links.py ~/Downloads/"Danh sach.xlsx" --side bride
  python3 tools/make_links.py nha_trai.xlsx --side groom --page traditional
  python3 tools/make_links.py list.xlsx --page intimate          # intimate ignores side

Writes "<input> - links.xlsx" next to the input (the original is never modified) with a
clickable Link column. Each link carries:
  name = Họ tên      → cover "Thân mời …" and the RSVP name
  call = Xưng Danh   → wording inside sentences (falls back to name when empty)
  side = groom|bride → which Google Form receives the RSVP (traditional page only)
Rows without a Họ tên are skipped.
"""
import argparse
import sys
from pathlib import Path
from urllib.parse import quote, urlencode

import openpyxl
from openpyxl.styles import Font

BASE = "https://vietanhphung.com/wed-invitation"


def clean(value):
    return " ".join(str(value).split()) if value not in (None, "") else ""


def link_for(page, name, call, side, sep="#"):
    params = {"name": name}
    if call:
        params["call"] = call
    if side and page == "traditional":
        params["side"] = side
    # quote_via=quote → spaces as %20, which survives Zalo / Messenger better than "+".
    # "#" (default): Facebook/Messenger ignore the fragment, so every link reuses the page's one
    # cached preview and it shows instantly; "?" makes each link a new URL Facebook must fetch first.
    return f"{BASE}/{page}/{sep}" + urlencode(params, quote_via=quote)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("xlsx", type=Path)
    ap.add_argument("--side", choices=["groom", "bride"], help="whose guests this sheet holds (traditional RSVP form)")
    ap.add_argument("--page", choices=["traditional", "intimate"], default="traditional")
    ap.add_argument("--sheet", help="sheet name (default: first sheet)")
    ap.add_argument("--query", action="store_true", help="old-style ?name=… links instead of #name=…")
    ap.add_argument("--out", type=Path, help="output file (default: '<input> - links.xlsx')")
    a = ap.parse_args()

    wb = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)
    ws = wb[a.sheet] if a.sheet else wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        sys.exit("empty sheet")

    out_wb = openpyxl.Workbook()
    out = out_wb.active
    out.title = (ws.title or "Links")[:31]
    out.append(["STT", "Họ tên", "Xưng Danh", "Link"])
    for cell in out[1]:
        cell.font = Font(bold=True)

    count = 0
    for r in rows[1:]:
        stt, name, call = (list(r) + [None] * 3)[:3]
        name, call = clean(name), clean(call)
        if not name:
            continue
        url = link_for(a.page, name, call, a.side, "?" if a.query else "#")
        out.append([stt, name, call, url])
        c = out.cell(row=out.max_row, column=4)
        c.hyperlink = url
        c.font = Font(color="0563C1", underline="single")
        count += 1

    for col, width in zip("ABCD", (6, 26, 24, 110)):
        out.column_dimensions[col].width = width
    out.freeze_panes = "A2"

    dest = a.out or a.xlsx.with_name(f"{a.xlsx.stem} - links.xlsx")
    out_wb.save(dest)
    print(f"{count} links → {dest}")


if __name__ == "__main__":
    main()
