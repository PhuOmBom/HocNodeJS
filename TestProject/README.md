# Bookstore Marketplace (TestProject)

Dự án website mua bán sách trực tuyến xây dựng bằng **Node.js**, **Express**, **MongoDB (Mongoose)** và **Vanilla HTML/CSS/JS**.

---

## 1. Cài đặt & Cấu hình môi trường

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```

2. **Tạo file cấu hình môi trường `.env`:**
   Tạo file `.env` ở thư mục gốc (hoặc sao chép từ `.env.example`) và điền các thông tin:
   ```env
   PORT=3000
   CLIENT_URL=http://localhost:3000
   MONGODB_URI=mongodb://lenhatquangldb_db_user:X2ezQ3VJEpDkEDYB@ac-bkgrleg-shard-00-00.ssg10ou.mongodb.net:27017,ac-bkgrleg-shard-00-01.ssg10ou.mongodb.net:27017,ac-bkgrleg-shard-00-02.ssg10ou.mongodb.net:27017/bookstore?ssl=true&replicaSet=atlas-337o22-shard-0&authSource=admin&appName=Cluster0
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=1h
   ```

---

## 2. Tạo tài khoản Admin để Test

Để tạo tài khoản quản trị viên (Admin) hoặc nâng cấp một tài khoản có sẵn lên quyền Admin, bạn chạy script sau trong terminal:

### Cách 1: Chạy tương tác (Interactive prompt)
```bash
npm run create-admin
```
Sau đó nhập lần lượt:
- **Admin name**: Tên hiển thị (ví dụ: `Admin`)
- **Admin email**: Email đăng nhập (ví dụ: `admin@example.com`)
- **Admin password**: Mật khẩu (tối thiểu 6 ký tự)

### Cách 2: Chạy trực tiếp kèm tham số
```bash
node scripts/createAdmin.js "Admin" "admin@example.com" "123456"
```

> **Ghi chú:**
> - Nếu email đã tồn tại trong database, hệ thống sẽ tự động cập nhật role thành `admin` và đặt lại mật khẩu mới.
> - Nếu email chưa tồn tại, hệ thống sẽ tạo mới tài khoản admin.

---

## 3. Nạp dữ liệu sách vào Database (Seed Books)

Để tự động nạp danh sách các cuốn sách/truyện nổi tiếng (One Piece, Naruto, Conan, Atomic Habits, Clean Code, Harry Potter,...) kèm đầy đủ tên, tác giả, mô tả, ảnh bìa, giá tiền, số lượng tồn kho và thể loại vào MongoDB:

```bash
npm run seed-books
```

Hoặc tìm kiếm và nhập sách bất kỳ qua Google Books API:
```bash
node scripts/seedBooks.js --search "Harry Potter"
```

---

## 4. Chạy dự án

### Chế độ Development (Tự động reload khi sửa code):
```bash
npm run dev
```

### Chế độ Production:
```bash
npm start
```

Sau khi chạy thành công, mở trình duyệt và truy cập:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 5. Các đường dẫn chính

- **Trang chủ**: `http://localhost:3000/`
- **Chi tiết sản phẩm**: `http://localhost:3000/book-detail?id=<id>` (hoặc click trực tiếp vào bất kỳ cuốn sách nào trên trang chủ)
- **Đăng nhập**: `http://localhost:3000/login.html`
- **Đăng ký**: `http://localhost:3000/register.html`
- **Quản lý / Dashboard**: `http://localhost:3000/dashboard.html` (Dành cho Admin, Seller, Buyer)
- **Đăng bán sách**: `http://localhost:3000/publish.html` (Dành cho Seller)
- **Giỏ hàng**: `http://localhost:3000/cart.html`
