# Graph Report - wed_invitation  (2026-11-23)

## Corpus Check
- 12 files · ~16,203 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 3, .iml 1)

## Summary
- 131 nodes · 210 edges · 12 communities (6 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84264614`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- traditional/main.js
- intimate/main.js
- photos.py
- make_links.py
- countryside/main.js
- Thiệp cưới online — Việt Anh & Hương Giang
- rebuild_photos.sh
- install_hooks.sh
- stamp_version.sh

## God Nodes (most connected - your core abstractions)
1. `setupChrome()` - 7 edges
2. `setupChrome()` - 7 edges
3. `setupChrome()` - 7 edges
4. `load()` - 7 edges
5. `main()` - 7 edges
6. `place()` - 7 edges
7. `setPhoto()` - 6 edges
8. `sheet()` - 6 edges
9. `main()` - 6 edges
10. `Thiệp cưới online — Việt Anh & Hương Giang` - 6 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `argparse`  [EXTRACTED]
  tools/photos.py →   _Bridges community 2 → community 3_

## Import Cycles
- None detected.

## Communities (12 total, 6 thin omitted)

### Community 0 - "traditional/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 1 - "intimate/main.js"
Cohesion: 0.11
Nodes (21): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderAmenities(), renderChapters(), renderGallery() (+13 more)

### Community 2 - "photos.py"
Cohesion: 0.17
Nodes (10): _box(), denoise(), film_grade(), load(), main(), place(), placeholders(), qr() (+2 more)

### Community 3 - "make_links.py"
Cohesion: 0.29
Nodes (3): clean(), link_for(), main()

### Community 4 - "countryside/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 5 - "Thiệp cưới online — Việt Anh & Hương Giang"
Cohesion: 0.29
Nodes (6): Link riêng cho từng khách, Thiệp cưới online — Việt Anh & Hương Giang, Tuỳ chỉnh, Xem thử, Xác nhận tham dự (mẫu intimate), Đưa lên mạng

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `make_links.py` to `photos.py`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `traditional/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `intimate/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11264367816091954 - nodes in this community are weakly interconnected._
- **Should `countryside/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._