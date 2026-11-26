# Graph Report - wed_invitation  (2026-11-25)

## Corpus Check
- 52 files · ~29,770 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 4, .example 2)

## Summary
- 340 nodes · 587 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c46cef9`
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
- aws.js
- build.sh

## God Nodes (most connected - your core abstractions)
1. `Wedding photo gallery — AWS infrastructure` - 16 edges
2. `with` - 14 edges
3. `terraform.sh script` - 14 edges
4. `plan()` - 10 edges
5. `removePhoto()` - 9 edges
6. `initAdmin()` - 9 edges
7. `signS3()` - 9 edges
8. `bold()` - 9 edges
9. `tile()` - 8 edges
10. `thumbKeyFor()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `uploadOne()` --calls--> `signS3()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `removePhoto()` --calls--> `signS3()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `initAdmin()` --calls--> `startLogin()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `credentials()` --calls--> `getCredentials()`  [EXTRACTED]
  intimate/gallery/main.js → intimate/gallery/aws.js
- `removePhoto()` --calls--> `tokenExpiry()`  [EXTRACTED]
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
Cohesion: 0.12
Nodes (39): cognitoIdentity(), finishLogin(), getCredentials(), logoutUrl(), tokenExpiry(), beginAdmin(), credentials(), endAdmin() (+31 more)

### Community 4 - "countryside/main.js"
Cohesion: 0.14
Nodes (20): bindPhotos(), closeLightbox(), lockCover(), openLightbox(), playMusic(), renderChapters(), renderGallery(), renderGifts() (+12 more)

### Community 5 - "Thiệp cưới online — Việt Anh & Hương Giang"
Cohesion: 0.29
Nodes (6): Link riêng cho từng khách, Thiệp cưới online — Việt Anh & Hương Giang, Tuỳ chỉnh, Xem thử, Xác nhận tham dự (mẫu intimate), Đưa lên mạng

### Community 7 - "with"
Cohesion: 0.07
Nodes (36): environment, if, needs, permissions, runs-on, steps, jobs, apply (+28 more)

### Community 8 - "env"
Cohesion: 0.08
Nodes (23): default, description, type, concurrency, cancel-in-progress, group, env, TF_DIR (+15 more)

### Community 9 - "terraform.sh"
Cohesion: 0.37
Nodes (18): apply(), bold(), bootstrap(), build_lambda(), check(), destroy(), die(), need_aws() (+10 more)

### Community 10 - "index.mjs"
Cohesion: 0.15
Nodes (27): cfg, dryRun, existing, objects, s3, todo, cfg, handler() (+19 more)

### Community 11 - "package.json"
Cohesion: 0.15
Nodes (13): description, devDependencies, @smithy/signature-v4@^5.7.5, engines, node, main, name, private (+5 more)

### Community 17 - "Wedding photo gallery — AWS infrastructure"
Cohesion: 0.12
Nodes (16): Admin setup, AWS authentication, CI/CD (`.github/workflows/infra.yml`), Cleanup / destroy, Configuration, Cost, Deploy the gallery page, Existing domain and DNS — not touched (+8 more)

### Community 18 - "aws.js"
Cohesion: 0.13
Nodes (13): RFC-3986, b64url(), enc, hex(), hmac(), sha256(), signS3(), startLogin() (+5 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3986`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `signS3()` connect `aws.js` to `gallery/main.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `RFC-3986` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `traditional/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Why does `@smithy/signature-v4` connect `package.json` to `aws.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `intimate/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11264367816091954 - nodes in this community are weakly interconnected._
- **Why does `jobs` connect `with` to `env`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `photos.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09815078236130868 - nodes in this community are weakly interconnected._