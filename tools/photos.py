#!/usr/bin/env python3
"""Photo pipeline for the invitation.

  python3 tools/photos.py sheet photos/                  # numbered contact sheets for picking
  python3 tools/photos.py place cover photos/IMG_0412.jpg
  python3 tools/photos.py place gallery-3 photos/IMG_0588.HEIC
  python3 tools/photos.py place gift-groom photos/x.jpg --no-grade
  python3 tools/photos.py qr groom ~/Downloads/qr.png
  python3 tools/photos.py placeholders

Slots: share, hero, cover, city-1, city-2, forest-1, forest-2, wide, date, closing, gift-groom, gift-bride, gallery-1..N
Every photo gets the same soft film grade (lifted blacks, warm highlights, slightly
muted colour) so pictures from different cameras sit together.
The `share` slot writes share.jpg (1200x630), the link preview for Zalo / Facebook.
"""
import argparse
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

Image.MAX_IMAGE_PIXELS = None  # our own high-res camera files, not untrusted input

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "photos"
QR = ROOT / "assets" / "qr"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}
SLOT_RE = re.compile(r"^(share|hero|cover|city-[12]|forest-[12]|wide|date|closing|gift-groom|gift-bride|gallery-\d+)$")
LONG_SIDE = {"wide": 2400, "closing": 2400, "cover": 2000, "hero": 2400}


def load(path, draft=None):
    """Open any photo (HEIC via macOS `sips`), honour EXIF rotation, return RGB.
    `draft` lets JPEG decode at reduced size — much faster for thumbnails."""
    path = Path(path)
    if path.suffix.lower() in {".heic", ".heif"}:
        tmp = Path(tempfile.mkdtemp()) / (path.stem + ".jpg")
        subprocess.run(["sips", "-s", "format", "jpeg", str(path), "--out", str(tmp)], check=True, capture_output=True)
        path = tmp
    im = Image.open(path)
    if draft:
        im.draft("RGB", (draft, draft))
    return ImageOps.exif_transpose(im).convert("RGB")


def film_grade(img):
    a = np.asarray(img, np.float32) / 255.0
    # gentle S-curve with lifted blacks and soft highlight roll-off
    a = 0.05 + 0.92 * (a - 0.035 * np.sin(2 * np.pi * a))
    # slightly muted colour
    grey = a.mean(axis=2, keepdims=True)
    a = grey + (a - grey) * 0.88
    # warm the highlights, keep shadows a touch cool-brown
    lum = grey
    a[..., 0] += 0.025 * lum[..., 0]
    a[..., 2] -= 0.035 * lum[..., 0]
    a[..., 1] += 0.008
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def straighten(img, degrees):
    """Rotate (positive = counter-clockwise) and trim to the largest same-aspect
    rectangle that contains no empty corners."""
    w, h = img.size
    t = math.radians(abs(degrees))
    s = min(w / (w * math.cos(t) + h * math.sin(t)), h / (w * math.sin(t) + h * math.cos(t)))
    img = img.rotate(degrees, Image.BICUBIC)
    cw, ch = w * s, h * s
    return img.crop((round((w - cw) / 2), round((h - ch) / 2), round((w + cw) / 2), round((h + ch) / 2)))


def place(slot, src, grade=True, crop=None, rotate=0.0):
    if not SLOT_RE.match(slot):
        sys.exit(f"unknown slot '{slot}'. Slots: share, hero, cover, city-1, city-2, forest-1, forest-2, wide, date, closing, gift-groom, gift-bride, gallery-N")
    img = load(src)
    if rotate:
        img = straighten(img, rotate)
    if crop:  # fractions of the original: left, top, right, bottom
        l, t, r, b = crop
        img = img.crop((round(l * img.width), round(t * img.height), round(r * img.width), round(b * img.height)))
    OUT.mkdir(parents=True, exist_ok=True)
    if slot == "share":  # link preview for Zalo / Messenger / Facebook: 1200x630 JPEG
        img = ImageOps.fit(img, (1200, 630), Image.LANCZOS, centering=(0.5, 0.4))
        out = OUT / "share.jpg"
        (film_grade(img) if grade else img).save(out, "JPEG", quality=86)
        print(f"{slot:<10} <- {Path(src).name}  (1200x630, {out.stat().st_size // 1024} KB)")
        return
    img.thumbnail((LONG_SIDE.get(slot, 1800),) * 2, Image.LANCZOS)
    if grade:
        img = film_grade(img)
    out = OUT / f"{slot}.webp"
    img.save(out, "WEBP", quality=82, method=6)
    print(f"{slot:<10} <- {Path(src).name}  ({img.width}x{img.height}, {out.stat().st_size // 1024} KB)")


def sheet(folder, per=20, cols=5, cell=360):
    files = sorted(p for p in Path(folder).rglob("*") if p.suffix.lower() in EXTS)
    if not files:
        sys.exit(f"no photos in {folder}")
    out_dir = Path(tempfile.gettempdir()) / "wedding-sheets" / re.sub(r"\W+", "-", Path(folder).resolve().name).strip("-").lower()
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    index = []
    for s in range(0, len(files), per):
        chunk = files[s:s + per]
        rows = (len(chunk) + cols - 1) // cols
        board = Image.new("RGB", (cols * cell, rows * (cell + 24)), (250, 248, 244))
        d = ImageDraw.Draw(board)
        for i, f in enumerate(chunk):
            n = s + i + 1
            try:
                with Image.open(f) as raw:
                    size = "x".join(map(str, raw.size))
                im = load(f, draft=cell * 2)
                im.thumbnail((cell - 12, cell - 12))
            except Exception as e:  # unreadable file: still list it
                im, size = Image.new("RGB", (cell - 12, cell - 12), (220, 210, 200)), f"error: {e}"
            x, y = (i % cols) * cell, (i // cols) * (cell + 24)
            board.paste(im, (x + (cell - im.width) // 2, y + (cell - im.height) // 2))
            d.text((x + 8, y + cell), f"#{n} {f.name[:30]}", fill=(58, 46, 40), font=font)
            index.append(f"#{n}\t{size}\t{f}")
        path = out_dir / f"sheet-{s // per + 1:02d}.jpg"
        board.save(path, "JPEG", quality=80)
        print(path)
    (out_dir / "index.tsv").write_text("\n".join(index))
    print(out_dir / "index.tsv")


def qr(who, src):
    img = load(src)
    img.thumbnail((900, 900), Image.NEAREST)
    QR.mkdir(parents=True, exist_ok=True)
    img.save(QR / f"{who}.webp", "WEBP", lossless=True)
    print(f"wrote assets/qr/{who}.webp")


def placeholders():
    """Soft tonal stand-ins so the layout is visible before the real photos arrive."""
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia Italic.ttf", 46)
    except OSError:
        font = ImageFont.load_default()
    shapes = {"cover": (1600, 2000), "city-1": (1600, 2000), "city-2": (1200, 1600), "forest-1": (1600, 2000),
              "forest-2": (1200, 1600), "wide": (2400, 1350), "date": (1200, 1600), "closing": (2400, 1600),
              "gift-groom": (1200, 1600), "gift-bride": (1200, 1600), **{f"gallery-{i}": (1200, 1500) for i in range(1, 7)}}
    tones = [(216, 203, 187), (201, 184, 164), (226, 216, 202), (190, 165, 140), (210, 190, 168)]
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (slot, (w, h)) in enumerate(shapes.items()):
        top, bottom = np.array(tones[i % 5], np.float32), np.array(tones[(i + 2) % 5], np.float32)
        t = np.linspace(0, 1, h)[:, None, None]
        img = Image.fromarray(np.broadcast_to(top + (bottom - top) * t, (h, w, 3)).astype(np.uint8))
        ImageDraw.Draw(img).text((w / 2, h / 2), slot, fill=(122, 92, 70), font=font, anchor="mm")
        img.save(OUT / f"{slot}.webp", "WEBP", quality=70)
        if slot == "cover":
            ImageOps.fit(img, (1200, 630)).save(OUT / "share.jpg", "JPEG", quality=80)
    print("wrote placeholders to assets/photos/")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["sheet", "place", "qr", "placeholders"])
    p.add_argument("args", nargs="*")
    p.add_argument("--no-grade", action="store_true", help="keep the photo's original colours")
    p.add_argument("--crop", metavar="L,T,R,B", help="zoom into part of the photo, as fractions, e.g. 0.19,0.375,0.81,1")
    p.add_argument("--rotate", type=float, default=0.0, metavar="DEG", help="straighten a tilted photo (positive = counter-clockwise), applied before --crop")
    a = p.parse_args()
    crop = tuple(float(v) for v in a.crop.split(",")) if a.crop else None
    if crop and (len(crop) != 4 or not (0 <= crop[0] < crop[2] <= 1 and 0 <= crop[1] < crop[3] <= 1)):
        sys.exit("--crop needs four fractions L,T,R,B with L<R and T<B, all between 0 and 1")
    if a.cmd == "sheet" and len(a.args) == 1:
        sheet(a.args[0])
    elif a.cmd == "place" and len(a.args) == 2:
        place(a.args[0], a.args[1], grade=not a.no_grade, crop=crop, rotate=a.rotate)
    elif a.cmd == "qr" and len(a.args) == 2 and a.args[0] in ("groom", "bride"):
        qr(*a.args)
    elif a.cmd == "placeholders":
        placeholders()
    else:
        p.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
