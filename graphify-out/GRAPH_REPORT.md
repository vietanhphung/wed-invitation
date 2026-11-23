# Graph Report - wed_invitation  (2026-11-23)

## Corpus Check
- 10 files · ~12,313 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .css 3, .iml 1)

## Summary
- 105 nodes · 167 edges · 14 communities (9 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `00ea6d3a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- traditional/main.js
- intimate/main.js
- photos.py
- make_links.py
- Thiệp cưới online — Việt Anh & Hương Giang
- setPhoto
- showLb
- setupChrome
- playMusic
- rebuild_photos.sh
- install_hooks.sh
- stamp_version.sh

## God Nodes (most connected - your core abstractions)
1. `setupChrome()` - 7 edges
2. `setupChrome()` - 7 edges
3. `load()` - 7 edges
4. `main()` - 7 edges
5. `place()` - 7 edges
6. `setPhoto()` - 6 edges
7. `sheet()` - 6 edges
8. `main()` - 6 edges
9. `Thiệp cưới online — Việt Anh & Hương Giang` - 6 edges
10. `setPhoto()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `renderGallery()` --calls--> `setPhoto()`  [EXTRACTED]
  intimate/main.js → intimate/main.js  _Bridges community 6 → community 7_
- `setupChrome()` --calls--> `showLb()`  [EXTRACTED]
  intimate/main.js → intimate/main.js  _Bridges community 7 → community 8_
- `setupChrome()` --calls--> `playMusic()`  [EXTRACTED]
  intimate/main.js → intimate/main.js  _Bridges community 9 → community 8_
- `main()` --calls--> `argparse`  [EXTRACTED]
  tools/photos.py →   _Bridges community 2 → community 3_

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "traditional/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 1 - "intimate/main.js"
Cohesion: 0.18
Nodes (4): renderVenues(), safeUrl(), setupRsvp(), toast()

### Community 2 - "photos.py"
Cohesion: 0.17
Nodes (10): _box(), denoise(), film_grade(), load(), main(), place(), placeholders(), qr() (+2 more)

### Community 3 - "make_links.py"
Cohesion: 0.29
Nodes (3): clean(), link_for(), main()

### Community 5 - "Thiệp cưới online — Việt Anh & Hương Giang"
Cohesion: 0.29
Nodes (6): Link riêng cho từng khách, Thiệp cưới online — Việt Anh & Hương Giang, Tuỳ chỉnh, Xem thử, Xác nhận tham dự (mẫu intimate), Đưa lên mạng

### Community 6 - "setPhoto"
Cohesion: 0.40
Nodes (5): bindPhotos(), renderAmenities(), renderChapters(), renderGifts(), setPhoto()

### Community 7 - "showLb"
Cohesion: 0.40
Nodes (5): closeLightbox(), openLightbox(), renderGallery(), setupLightbox(), showLb()

### Community 8 - "setupChrome"
Cohesion: 0.50
Nodes (4): lockCover(), setupChrome(), setupReveal(), unlockCover()

### Community 9 - "playMusic"
Cohesion: 1.00
Nodes (3): playMusic(), setMusicUI(), setupMusic()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `make_links.py` to `photos.py`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `traditional/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._