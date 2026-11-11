# Thiệp cưới online — Việt Anh & Hương Giang

Hai mẫu thiệp trong cùng một repo, dùng chung ảnh và nhạc:

| Link | Mẫu | Thư mục |
|---|---|---|
| `vietanhphung.com/wed-invitation/traditional/` | **Film & Maple** — tối giản, ảnh màu phim Toronto & Algonquin | `traditional/` |
| `vietanhphung.com/wed-invitation/intimate/` | **Hoa Rum** — tiệc cưới thân mật: phong bì, sáp niêm phong, hoa rum, polaroid, xác nhận tham dự | `intimate/` |
| `vietanhphung.com/wed-invitation/` | tự chuyển sang `/traditional/` (link cũ vẫn dùng được, giữ cả `?name=`) | `index.html` |

```
traditional/   index.html · style.css · config.js · main.js
intimate/      index.html · style.css · config.js · main.js · calla.svg
assets/        photos/ · music/ · qr/   ← dùng chung cho cả hai mẫu
tools/         photos.py · rebuild_photos.sh
photos/        ảnh gốc (chỉ ở máy, không đưa lên mạng)
```

## Tuỳ chỉnh

1. **Thông tin**: mỗi mẫu có file riêng — `traditional/config.js` và `intimate/config.js` (tên, ngày giờ, ngày âm lịch, địa điểm, tài khoản, nhạc…).
   `intimate/config.js` còn có: bố mẹ hai bên, lịch trình buổi tiệc, màu dress code, ảnh dùng cho từng phần, và cách nhận xác nhận tham dự.
2. **Ảnh**: ảnh gốc nằm trong `photos/` với tên theo vị trí trên trang (`cover.jpg`, `city-1.jpg`, `gift-groom.jpg`, `gallery-1.jpg`…).
   Muốn đổi ảnh: thay file trong `photos/` (giữ nguyên tên), rồi chạy:
   ```bash
   ./tools/rebuild_photos.sh        # tạo lại toàn bộ ảnh web trong assets/photos/
   ```
   Mỗi ảnh được chỉnh màu phim nhẹ cho đồng bộ. Vị trí cắt ảnh chỉnh bằng `pos` trong config; xoay / phóng to ghi trong `tools/rebuild_photos.sh`.
   Chọn ảnh từ một thư mục lớn: `python3 tools/photos.py sheet <thư-mục>` tạo bảng ảnh thu nhỏ có đánh số.
   Ảnh xem trước khi chia sẻ link: lưu ảnh vào `photos/share.jpg` rồi chạy lại script trên.
3. **Mã QR**: `python3 tools/photos.py qr groom ~/Downloads/qr.png` (cô dâu thì thay `groom` bằng `bride`).
4. **Nhạc nền**: `assets/music/song.mp3` (bản gốc chất lượng cao giữ ở `song-original.mp3`, không đưa lên mạng).

## Link riêng cho từng khách

Thêm `?name=` vào cuối link của mẫu nào cũng được, ví dụ:
`https://vietanhphung.com/wed-invitation/intimate/?name=anh Tuấn và chị Lan`

Thiệp sẽ hiện **"Thân mời anh Tuấn và chị Lan"** và dùng tên khách trong lời mời, lời cảm ơn, và điền sẵn vào ô xác nhận tham dự.
Không có `?name=`: mẫu traditional ghi "bạn", mẫu intimate ghi "Quý vị & Gia đình".
(Nếu tên có dấu `&`, `#` hoặc `?`, hãy thay bằng `%26`, `%23`, `%3F`.)

## Xác nhận tham dự (mẫu intimate)

- **Mặc định** (`rsvp.endpoint` để trống): khi khách bấm gửi, lời nhắn xác nhận được sao chép sẵn; nếu điền số `rsvp.zalo`, Zalo sẽ mở để khách dán và gửi cho bạn.
- **Tự động lưu vào Google Sheet**:
  1. Tạo một Google Sheet → **Tiện ích mở rộng → Apps Script**, dán đoạn sau rồi lưu:
     ```js
     function doPost(e) {
       const p = e.parameter;
       SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
         .appendRow([new Date(), p.name, p.side, p.attend, p.guests, p.message]);
       return ContentService.createTextOutput('ok');
     }
     ```
  2. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**; *Thực thi với tư cách*: Tôi; *Người có quyền truy cập*: Bất kỳ ai.
  3. Dán URL ứng dụng web vào `rsvp.endpoint` trong `intimate/config.js`.

## Xem thử

Chạy `python3 -m http.server` ở thư mục này rồi vào http://localhost:8000/intimate/ hoặc http://localhost:8000/traditional/.
(Mở trực tiếp file trên máy cũng được, nhưng phải mở đúng `traditional/index.html` hoặc `intimate/index.html`.)

## Đưa lên mạng

```bash
git add -A && git commit -m "…" && git push
```
GitHub Pages tự cập nhật sau khoảng 1 phút.
