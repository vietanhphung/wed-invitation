#!/bin/sh
# Rebuild every web photo in assets/photos/ from the originals in photos/.
# To swap a photo: replace photos/<slot>.jpg and run this script again.
# (Camera file numbers from the photographer are noted for reference.)
set -e
cd "$(dirname "$0")/.."
place() { python3 tools/photos.py place "$@"; }

place hero       photos/hero.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place cover      photos/cover.jpg        # HY707180 — intimate envelope polaroid
place city-1     photos/city-1.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place city-2     photos/city-2.jpg --no-grade --crop 0.2763,0.0599,0.8345,1   # HYC08182, same framing as emmy's crop, from the original JPG
place forest-1   photos/forest-1.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place forest-2   photos/forest-2.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place wide       photos/wide.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place date       photos/date.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place closing    photos/closing.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gift-groom photos/gift-groom.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gift-bride photos/gift-bride.jpg --crop 0.19,0.375,0.81,1     # HY705592, zoomed to match the groom
place gallery-1  photos/gallery-1.jpg    # HY704956
place gallery-2  photos/gallery-2.jpg    # HY706765
place gallery-3  photos/gallery-3.jpg    # HY707511 — intimate album only
place gallery-4  photos/gallery-4.jpg    # HYC08544
place gallery-5  photos/previous/gallery-14.jpg   # HYC08527 bouquet & shoes (moved here 22/11)
place gallery-6  photos/gallery-13.jpg    # HYC08254 streetcar tracks (moved here 22/11)
place gallery-7  photos/gallery-7.jpg    # HY704916
place gallery-8  photos/gallery-8.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-9  photos/gallery-9.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-10 photos/gallery-10.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-11 photos/gallery-11.jpg   # HY706832
place gallery-12 photos/gallery-12.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-13 photos/gallery-13.jpg   # HYC08254
place gallery-14 photos/gallery-14.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-15 photos/gallery-15.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited
place gallery-16 photos/gallery-16.webp --no-grade   # new pick (22/11): resized only, colours and grain as edited

# link preview image (Zalo / Messenger / Facebook), 1200x630 — HY705720, cropped to drop the blown-out sky
if [ -f photos/share.jpg ]; then place share photos/share.jpg --crop 0,0.16,1,0.975; else echo "share      (photos/share.jpg missing — keeping the current preview image)"; fi
