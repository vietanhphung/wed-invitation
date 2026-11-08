# Thiệp cưới online — Film & Maple

Thiệp cưới một trang phong cách tối giản, ảnh màu phim: Toronto và rừng phong
Algonquin. Gồm màn hình mở thiệp, đếm ngược, câu chuyện hai chương, lịch ngày
cưới, album ảnh, địa điểm, mã QR mừng cưới và nhạc nền.

## Tuỳ chỉnh

1. **Thông tin**: sửa `assets/js/config.js` (tên, ngày giờ, ngày âm lịch, lời mời, câu chuyện, địa điểm, tài khoản, nhạc).
2. **Ảnh**: chép ảnh gốc vào thư mục `photos/` (thư mục này không được đưa lên mạng), rồi chạy:
   ```bash
   python3 tools/photos.py sheet photos/                 # tạo bảng ảnh thu nhỏ có đánh số để chọn
   python3 tools/photos.py place cover photos/IMG_0412.jpg
   ```
   Các vị trí ảnh: `cover`, `city-1`, `city-2`, `forest-1`, `forest-2`, `wide`, `date`, `closing`, `gift-groom`, `gift-bride`, `gallery-1…6`.
   Mỗi ảnh được chỉnh màu phim nhẹ cho đồng bộ (`--no-grade` để giữ màu gốc). Vị trí cắt ảnh chỉnh bằng `pos` trong config.
3. **Mã QR**: `python3 tools/photos.py qr groom ~/Downloads/qr.png` (cô dâu thì thay `groom` bằng `bride`).
4. **Nhạc nền**: chép file mp3 vào `assets/music/song.mp3`.
5. **Ảnh xem trước khi chia sẻ**: sau khi đưa trang lên mạng, đổi `og:image` trong `index.html` thành đường dẫn đầy đủ tới `assets/photos/share.jpg`.

## Xem thử

Mở trực tiếp `index.html`, hoặc chạy `python3 -m http.server` rồi vào http://localhost:8000.

## Đưa lên mạng (GitHub Pages, miễn phí)

Đẩy thư mục này lên GitHub, rồi vào **Settings → Pages → Deploy from branch → `main` / root**.
