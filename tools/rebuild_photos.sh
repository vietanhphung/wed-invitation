#!/bin/sh
# Rebuild every web photo in assets/photos/ from the originals in photos/.
# To swap a photo: replace photos/<slot>.jpg and run this script again.
# (Camera file numbers from the photographer are noted for reference.)
set -e
cd "$(dirname "$0")/.."
place() { python3 tools/photos.py place "$@"; }

place hero       photos/hero.jpg         # HY704980 — traditional page, first section
place cover      photos/cover.jpg        # HY707180 — intimate envelope polaroid
place city-1     photos/city-1.jpg       # HYC08673
place city-2     photos/city-2.jpg       # HYC08193
place forest-1   photos/forest-1.jpg     # HYC09320
place forest-2   photos/forest-2.jpg     # HYC09682
place wide       photos/wide.jpg         # HYC09520
place date       photos/date.jpg         # HYC09743 (was HYC09739, kept as photos/HYC09739.jpg)
place closing    photos/closing.jpg      # HYC08872
place gift-groom photos/gift-groom.jpg --rotate -6                  # HYC08090_(2), straightened
place gift-bride photos/gift-bride.jpg --crop 0.19,0.375,0.81,1     # HY705592, zoomed to match the groom
place gallery-1  photos/gallery-1.jpg    # HY704956
place gallery-2  photos/gallery-2.jpg    # HY706765
place gallery-3  photos/gallery-3.jpg    # HY707511 — intimate album only
place gallery-4  photos/gallery-4.jpg    # HYC08544
place gallery-5  photos/gallery-5.jpg    # HYC09401
place gallery-6  photos/gallery-6.jpg    # HYC08314
place gallery-7  photos/gallery-7.jpg    # HY704916
place gallery-8  photos/gallery-8.jpg    # HY705345
place gallery-9  photos/gallery-9.jpg    # HY706274
place gallery-10 photos/gallery-10.jpg   # HY706760
place gallery-11 photos/gallery-11.jpg   # HY706832
place gallery-12 photos/gallery-12.jpg   # HYC08061
place gallery-13 photos/gallery-13.jpg   # HYC08254
place gallery-14 photos/gallery-14.jpg   # HYC08527
place gallery-15 photos/gallery-15.jpg   # HY708107

# link preview image (Zalo / Messenger / Facebook), 1200x630 — HY705720, cropped to drop the blown-out sky
if [ -f photos/share.jpg ]; then place share photos/share.jpg --crop 0,0.16,1,0.975; else echo "share      (photos/share.jpg missing — keeping the current preview image)"; fi
