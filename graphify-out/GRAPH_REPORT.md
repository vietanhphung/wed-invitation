# Graph Report - wed_invitation  (2026-11-25)

## Corpus Check
- 51 files · ~28,998 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 4, .example 2)

## Summary
- 328 nodes · 553 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93d454bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- traditional/main.js
- intimate/main.js
- photos.py
- gallery/main.js
- countryside/main.js
- Thiệp cưới online — Việt Anh & Hương Giang
- with
- env
- terraform.sh
- index.mjs
- package.json
- rebuild_photos.sh
- install_hooks.sh
- stamp_version.sh
- Wedding photo gallery — AWS infrastructure
- apply
- build.sh

## God Nodes (most connected - your core abstractions)
1. `Wedding photo gallery — AWS infrastructure` - 16 edges
2. `with` - 14 edges
3. `terraform.sh script` - 14 edges
4. `plan()` - 10 edges
5. `initAdmin()` - 9 edges
6. `signS3()` - 9 edges
7. `bold()` - 9 edges
8. `render()` - 8 edges
9. `apply()` - 8 edges
10. `removePhoto()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `credentials()` --calls--> `getCredentials()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `uploadOne()` --calls--> `signS3()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `removePhoto()` --calls--> `signS3()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `removePhoto()` --calls--> `tokenExpiry()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `initAdmin()` --calls--> `finishLogin()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js

## Import Cycles
- None detected.

## Communities (21 total, 8 thin omitted)

### Community 0 - "traditional/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 1 - "intimate/main.js"
Cohesion: 0.11
Nodes (21): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderAmenities(), renderChapters(), renderGallery() (+13 more)

### Community 2 - "photos.py"
Cohesion: 0.10
Nodes (14): main(), clean(), link_for(), main(), _box(), denoise(), film_grade(), load() (+6 more)

### Community 3 - "gallery/main.js"
Cohesion: 0.10
Nodes (45): RFC-3986, b64url(), cognitoIdentity(), enc, finishLogin(), getCredentials(), hex(), hmac() (+37 more)

### Community 4 - "countryside/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 5 - "Thiệp cưới online — Việt Anh & Hương Giang"
Cohesion: 0.29
Nodes (6): Link riêng cho từng khách, Thiệp cưới online — Việt Anh & Hương Giang, Tuỳ chỉnh, Xem thử, Xác nhận tham dự (mẫu intimate), Đưa lên mạng

### Community 7 - "with"
Cohesion: 0.14
Nodes (19): steps, steps, name, run, uses, with, working-directory, steps (+11 more)

### Community 8 - "env"
Cohesion: 0.08
Nodes (28): environment, if, needs, permissions, runs-on, concurrency, cancel-in-progress, group (+20 more)

### Community 9 - "terraform.sh"
Cohesion: 0.37
Nodes (18): apply(), bold(), bootstrap(), build_lambda(), check(), destroy(), die(), need_aws() (+10 more)

### Community 10 - "index.mjs"
Cohesion: 0.26
Nodes (15): cfg, handler(), isNotFound(), log(), processOriginal(), rebuildManifest(), s3, ALLOWED_FORMATS (+7 more)

### Community 11 - "package.json"
Cohesion: 0.07
Nodes (21): dependencies, @aws-sdk/client-s3@^3.700.0, sharp@^0.33.5, description, devDependencies, @smithy/signature-v4@^5.7.5, engines, node (+13 more)

### Community 17 - "Wedding photo gallery — AWS infrastructure"
Cohesion: 0.12
Nodes (16): Admin setup, AWS authentication, CI/CD (`.github/workflows/infra.yml`), Cleanup / destroy, Configuration, Cost, Deploy the gallery page, Existing domain and DNS — not touched (+8 more)

### Community 18 - "apply"
Cohesion: 0.17
Nodes (12): default, description, type, apply, on, pull_request, push, workflow_dispatch (+4 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3986`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 119 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `signS3()` connect `gallery/main.js` to `package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `RFC-3986` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traditional/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `intimate/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11264367816091954 - nodes in this community are weakly interconnected._
- **Should `photos.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09815078236130868 - nodes in this community are weakly interconnected._
- **Should `gallery/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10083256244218317 - nodes in this community are weakly interconnected._
- **Should `countryside/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._