# Thiệp cưới online — Film & Maple

Thiệp cưới một trang phong cách tối giản, ảnh màu phim: Toronto và rừng phong
Algonquin. Gồm màn hình mở thiệp, đếm ngược, câu chuyện hai chương, lịch ngày
cưới, album ảnh, địa điểm, mã QR mừng cưới và nhạc nền.

## Tuỳ chỉnh

1. **Thông tin**: sửa `assets/js/config.js` (tên, ngày giờ, ngày âm lịch, lời mời, câu chuyện, địa điểm, tài khoản, nhạc).
2. **Ảnh**: ảnh gốc nằm trong `photos/` với tên theo vị trí trên trang (`cover.jpg`, `city-1.jpg`, `gift-groom.jpg`, `gallery-1.jpg`…). Thư mục này không được đưa lên mạng.
   Muốn đổi ảnh: thay file trong `photos/` (giữ nguyên tên), rồi chạy:
   ```bash
   ./tools/rebuild_photos.sh        # tạo lại toàn bộ ảnh web trong assets/photos/
   ```
   Mỗi ảnh được chỉnh màu phim nhẹ cho đồng bộ. Vị trí cắt ảnh chỉnh bằng `pos` trong config; xoay / phóng to ghi trong `tools/rebuild_photos.sh`.
   Chọn ảnh từ một thư mục lớn: `python3 tools/photos.py sheet <thư-mục>` tạo bảng ảnh thu nhỏ có đánh số.
3. **Mã QR**: `python3 tools/photos.py qr groom ~/Downloads/qr.png` (cô dâu thì thay `groom` bằng `bride`).
4. **Nhạc nền**: `assets/music/song.mp3` (bản gốc chất lượng cao giữ ở `song-original.mp3`, không đưa lên mạng).
5. **Ảnh xem trước khi chia sẻ**: sau khi đưa trang lên mạng, đổi `og:image` trong `index.html` thành đường dẫn đầy đủ tới `assets/photos/share.jpg`.

## Link riêng cho từng khách

Thêm `?name=` vào cuối link, ví dụ `https://<user>.github.io/<repo>/?name=anh Tuấn và chị Lan`.
Màn hình mở thiệp sẽ hiện **"Thân mời anh Tuấn và chị Lan"**, và chữ "bạn" trong lời mời / phần mừng cưới được thay bằng tên khách.
Không có `?name=` thì thiệp hiển thị như bình thường. (Nếu tên có dấu `&`, `#` hoặc `?`, hãy thay bằng `%26`, `%23`, `%3F`.)

## Xem thử

Mở trực tiếp `index.html`, hoặc chạy `python3 -m http.server` rồi vào http://localhost:8000.

## Đưa lên mạng (GitHub Pages, miễn phí)

Đẩy thư mục này lên GitHub, rồi vào **Settings → Pages → Deploy from branch → `main` / root**.
