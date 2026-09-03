# Công cụ lấy mã TOTP 2FA

Trang web tĩnh tạo mã TOTP 6 chữ số theo chuẩn RFC 6238. Toàn bộ việc tính toán diễn ra trong trình duyệt bằng Web Crypto API; trang không có backend, không gửi secret đi đâu và không lưu secret vào `localStorage`.

## Dùng thử trên máy

Không mở trực tiếp bằng `file://` vì trình duyệt có thể chặn JavaScript module. Trong thư mục dự án, chạy một máy chủ tĩnh:

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Đưa lên GitHub Pages bằng giao diện web

1. Đăng nhập GitHub, chọn **New repository**.
2. Đặt tên kho, ví dụ `2fa`, chọn **Public**, rồi tạo kho.
3. Chọn **Add file → Upload files**, kéo toàn bộ file trong thư mục này vào và bấm **Commit changes**.
4. Mở **Settings → Pages**.
5. Tại **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn nhánh `main`, thư mục `/(root)`, rồi bấm **Save**.
7. Đợi khoảng 1–3 phút. Trang thường có địa chỉ `https://TEN-GITHUB.github.io/2fa/`.

## Đưa lên bằng Git

Tạo một repository trống trên GitHub trước, sau đó chạy:

```bash
git init
git add .
git commit -m "Create private TOTP tool"
git branch -M main
git remote add origin https://github.com/TEN-GITHUB/2fa.git
git push -u origin main
```

Sau đó bật GitHub Pages như bước 4–7 ở trên.

## Cách dùng an toàn

- Tốt nhất là mở trang rồi dán secret thủ công.
- Trang hỗ trợ `?secret=...` và `#secret=...` để tương thích với liên kết có sẵn, sau đó tự xóa secret khỏi thanh địa chỉ. Tuy vậy, không nên chia sẻ đường link chứa secret.
- Secret 2FA có quyền tạo mã đăng nhập. Ai có secret đều có thể tạo mã giống bạn.
- Không commit secret thật vào GitHub, kể cả repository riêng tư.
- Nếu secret từng xuất hiện trong tin nhắn, URL, ảnh chụp hoặc log, hãy tắt rồi bật lại 2FA để nhận secret mới.
- GitHub Pages phải được truy cập qua HTTPS để tính năng sao chép hoạt động ổn định.

## Thông số

- Thuật toán: HMAC-SHA-1
- Chu kỳ: 30 giây
- Độ dài: 6 chữ số
- Đầu vào: Base32 hoặc URI `otpauth://`

Các thông số này tương thích với cấu hình TOTP phổ biến của Google Authenticator, Microsoft Authenticator, Authy và nhiều dịch vụ khác.
