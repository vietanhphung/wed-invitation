#!/bin/sh
# Rebuild every web photo in assets/photos/ from the originals in photos/.
# To swap a photo: replace photos/<slot>.jpg and run this script again.
# (Camera file numbers from the photographer are noted for reference.)
set -e
cd "$(dirname "$0")/.."
place() { python3 tools/photos.py place "$@"; }

place cover      photos/cover.jpg        # HY707180
place city-1     photos/city-1.jpg       # HYC08673
place city-2     photos/city-2.jpg       # HYC08193
place forest-1   photos/forest-1.jpg     # HYC09320
place forest-2   photos/forest-2.jpg     # HYC09682
place wide       photos/wide.jpg         # HYC09520
place date       photos/date.jpg         # HYC09739
place closing    photos/closing.jpg      # HYC08872
place gift-groom photos/gift-groom.jpg --rotate -6                  # HYC08090_(2), straightened
place gift-bride photos/gift-bride.jpg --crop 0.19,0.375,0.81,1     # HY705592, zoomed to match the groom
place gallery-1  photos/gallery-1.jpg    # HY704956
place gallery-2  photos/gallery-2.jpg    # HY706765
place gallery-3  photos/gallery-3.jpg    # HY707511
place gallery-4  photos/gallery-4.jpg    # HYC08544
place gallery-5  photos/gallery-5.jpg    # HYC09401
place gallery-6  photos/gallery-6.jpg    # HYC08314

# link preview image (Zalo / Messenger / Facebook), 1200x630 — HY705720, cropped to drop the blown-out sky
if [ -f photos/share.jpg ]; then place share photos/share.jpg --crop 0,0.16,1,0.975; else echo "share      (photos/share.jpg missing — keeping the current preview image)"; fi
