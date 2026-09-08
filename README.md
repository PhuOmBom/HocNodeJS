# Học NodeJS - Dự án Bookstore Marketplace

Kho lưu trữ bài tập và dự án thực hành Node.js. Dự án trọng tâm là **TestProject** - Hệ thống website thương mại điện tử mua bán sách trực tuyến hoàn chỉnh.

---

## 1. Cài đặt & Cấu hình môi trường

1. **Di chuyển vào thư mục dự án:**
   ```bash
   cd TestProject
   ```

2. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```

3. **Tạo file cấu hình môi trường `.env`:**
   Tạo file `.env` ở thư mục `TestProject/` (hoặc sao chép từ `.env.example`) và điền các thông tin:
   ```env
   PORT=3000
   CLIENT_URL=http://localhost:3000
   MONGODB_URI=mongodb://127.0.0.1:27017/bookstore
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

---

## 2. Tạo tài khoản Admin để Test

Để tạo tài khoản quản trị viên (Admin) hoặc nâng cấp một tài khoản có sẵn lên quyền Admin:

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

---

## 3. Nạp dữ liệu sách vào Database (Seed Books)

Để tự động nạp danh sách hơn 100+ cuốn sách/truyện nổi tiếng (One Piece, Solo Leveling, Tower of God, Clean Code, Atomic Habits, Harry Potter,...) kèm đầy đủ tên, tác giả, mô tả, ảnh bìa, giá tiền, số lượng tồn kho và phân bổ đều cho 24 thể loại vào MongoDB:

```bash
npm run seed-books
```

---

## 4. Chạy dự án

### Chế độ Development (Tự động reload khi sửa code qua nodemon):
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

## 5. Các đường dẫn giao diện Web chính

- **Trang chủ**: `http://localhost:3000/`
- **Trang chi tiết sách**: `http://localhost:3000/book-detail?id=<bookId>`
- **Trang duyệt theo thể loại**: `http://localhost:3000/category?genre=<genreName>` hoặc `/category/:id`
- **Đăng nhập**: `http://localhost:3000/login`
- **Đăng ký**: `http://localhost:3000/register`
- **Trang hồ sơ cá nhân**: `http://localhost:3000/profile` (Đổi avatar, mật khẩu, sổ địa chỉ nhận hàng)
- **Đăng bán sách**: `http://localhost:3000/publish` (Dành cho Seller / Admin)
- **Dashboard Quản trị & Bán hàng**: `http://localhost:3000/dashboard` (Dành cho Seller & Admin)

---

# 📖 TÀI LIỆU RESTful API (API DOCUMENTATION)

## 1. Base URL

```
http://localhost:3000/api
```

Mọi request gửi lên server đều có tiền tố `/api` (Ví dụ: `http://localhost:3000/api/books`).

---

## 2. Cơ chế Xác thực & Hướng dẫn sử dụng Token

Hệ thống sử dụng **JSON Web Token (JWT)** để xác thực phiên người dùng.

### Bước 1: Gọi API Đăng nhập để lấy Token
Gửi request `POST /api/auth/login` với email và password:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response trả về:**
```json
{
  "message": "Signed in successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userID": "USR-1002",
    "name": "Nguyễn Văn A",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

### Bước 2: Gửi Token qua Authorization Header
Với tất cả các request yêu cầu đăng nhập, bạn cần đính kèm token vào Header theo định dạng **Bearer Token**:

```http
Authorization: Bearer <your_jwt_token_here>
```

> **Lưu ý:**
> - Server đồng thời tự động ghi nhận cookie `auth_token` (HTTP-only) khi đăng nhập trên trình duyệt.
> - Khi gọi bằng Postman, Mobile App hoặc ứng dụng bên ngoài, bạn chỉ cần gắn header `Authorization: Bearer <token>`.

---

## 3. Phân loại Route: Public và Cần đăng nhập

| Loại Route | Yêu cầu quyền | Danh sách chức năng tiêu biểu |
| :--- | :--- | :--- |
| 🟢 **Public Routes** | Không cần đăng nhập | Xem danh sách sách, chi tiết sách, danh mục thể loại, đăng ký, đăng nhập |
| 🟡 **Protected (User/Customer)** | Đã đăng nhập (`customer`, `seller`, `admin`) | Xem/sửa thông tin cá nhân, quản lý sổ địa chỉ, thêm/sửa/xóa giỏ hàng, đặt hàng (`checkout`), xem lịch sử đơn hàng của tôi, gửi yêu cầu trở thành người bán (Seller) |
| 🟠 **Protected (Seller)** | Quyền `seller` hoặc `admin` | Đăng sách mới, cập nhật/xóa sách của mình, cập nhật trạng thái đơn hàng của khách, xem Dashboard thống kê doanh thu bán hàng |
| 🔴 **Protected (Admin)** | Quyền `admin` | Xem tổng quan hệ thống (Analytics), quản lý người dùng (khóa/mở tài khoản, phân quyền), duyệt đơn đăng ký Seller, quản lý danh mục thể loại |

---

## 4. Danh sách Endpoint Chi Tiết

### 4.1. Authentication (Xác thực & Tài khoản)

#### `POST /api/auth/register` (Public)
Đăng ký tài khoản mới.
- **Request Body mẫu:**
  ```json
  {
    "name": "Trần Văn B",
    "email": "tranvanb@example.com",
    "password": "securePassword123",
    "phone": "0912345678"
  }
  ```
- **Response mẫu (201 Created):**
  ```json
  {
    "message": "Account created successfully. You can now sign in."
  }
  ```

#### `POST /api/auth/login` (Public)
Đăng nhập hệ thống để nhận JWT token.
- **Request Body mẫu:**
  ```json
  {
    "email": "tranvanb@example.com",
    "password": "securePassword123"
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Signed in successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userID": "USR-1003",
      "name": "Trần Văn B",
      "email": "tranvanb@example.com",
      "role": "customer",
      "avatar": "/css/avatar-placeholder.svg",
      "phone": "0912345678"
    }
  }
  ```

#### `POST /api/auth/logout` (Protected - Yêu cầu đăng nhập)
Đăng xuất và hủy phiên làm việc.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "You have been signed out."
  }
  ```

#### `GET /api/auth/profile` (Protected - Yêu cầu đăng nhập)
Lấy thông tin tài khoản hiện tại.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "user": {
      "userID": "USR-1003",
      "name": "Trần Văn B",
      "email": "tranvanb@example.com",
      "role": "customer",
      "phone": "0912345678",
      "address": "123 Nguyễn Trãi, Quận 1, TP.HCM",
      "avatar": "data:image/png;base64,..."
    }
  }
  ```

#### `PATCH /api/auth/profile` (Protected - Yêu cầu đăng nhập)
Cập nhật thông tin tài khoản, avatar hoặc đổi mật khẩu.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "name": "Trần Văn B Cập Nhật",
    "phone": "0987654321",
    "address": "456 Lê Lợi, Quận 1, TP.HCM",
    "avatar": "data:image/jpeg;base64,...",
    "currentPassword": "securePassword123",
    "newPassword": "newPassword456"
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Profile updated successfully.",
    "user": {
      "userID": "USR-1003",
      "name": "Trần Văn B Cập Nhật",
      "phone": "0987654321",
      "address": "456 Lê Lợi, Quận 1, TP.HCM"
    }
  }
  ```

---

### 4.2. Books (Quản lý Sách)

#### `GET /api/books` (Public)
Lấy danh sách sách kèm bộ lọc tìm kiếm, phân trang và sắp xếp.
- **Query Parameters (Tùy chọn):**
  - `search`: Từ khóa tìm kiếm theo tên sách hoặc tác giả (VD: `One Piece`)
  - `category`: Lọc theo ID danh mục
  - `minPrice`: Giá thấp nhất (VD: `5`)
  - `maxPrice`: Giá cao nhất (VD: `50`)
  - `sort`: Kiểu sắp xếp (`bestselling`, `price-asc`, `price-desc`, `rating`, `newest`)
  - `page`: Trang hiện tại (Mặc định: `1`)
  - `limit`: Số sách mỗi trang (Mặc định: `20`)
- **Response mẫu (200 OK):**
  ```json
  {
    "books": [
      {
        "_id": "6a9f07d9df9b842a3fd80f88",
        "title": "One Piece, Vol. 1",
        "author": "Eiichiro Oda",
        "price": 9.99,
        "stock": 45,
        "sold": 1250,
        "rating": 4.9,
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
        "category": {
          "_id": "673...",
          "name": "Japanese Manga"
        },
        "status": "active"
      }
    ],
    "total": 120,
    "page": 1,
    "totalPages": 6
  }
  ```

#### `GET /api/books/:id` (Public)
Xem chi tiết một cuốn sách.
- **Response mẫu (200 OK):**
  ```json
  {
    "book": {
      "_id": "6a9f07d9df9b842a3fd80f88",
      "title": "One Piece, Vol. 1",
      "author": "Eiichiro Oda",
      "description": "Monkey D. Luffy embarks on his journey to become Pirate King.",
      "price": 9.99,
      "stock": 45,
      "sold": 1250,
      "rating": 4.9,
      "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
      "category": {
        "_id": "673...",
        "name": "Japanese Manga"
      },
      "sellerId": "USR-1001",
      "publishedYear": 1997,
      "publisher": "Shueisha"
    }
  }
  ```

#### `POST /api/books` (Protected - Quyền: `seller` hoặc `admin`)
Đăng tải một cuốn sách mới lên hệ thống.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "description": "A Craftsman's Guide to Software Structure and Design.",
    "price": 34.99,
    "stock": 50,
    "category": "673...",
    "cover": "https://images.unsplash.com/photo-1532012164546-f432f2e3777a",
    "publisher": "Prentice Hall",
    "publishedYear": 2017
  }
  ```
- **Response mẫu (201 Created):**
  ```json
  {
    "message": "Book published successfully.",
    "book": {
      "_id": "6b1c...",
      "title": "Clean Architecture",
      "price": 34.99,
      "stock": 50
    }
  }
  ```

#### `PATCH /api/books/:id` (Protected - Quyền: `seller` hoặc `admin`)
Cập nhật thông tin sách.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "price": 29.99,
    "stock": 70
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Book updated successfully.",
    "book": {
      "_id": "6b1c...",
      "price": 29.99,
      "stock": 70
    }
  }
  ```

#### `DELETE /api/books/:id` (Protected - Quyền: `seller` hoặc `admin`)
Xóa một cuốn sách khỏi hệ thống.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Book removed successfully."
  }
  ```

---

### 4.3. Categories (Thể loại Sách)

#### `GET /api/categories` (Public)
Lấy danh sách tất cả các thể loại sách.
- **Response mẫu (200 OK):**
  ```json
  {
    "categories": [
      {
        "_id": "67cb1a48c4e365022dc70a91",
        "name": "Japanese Manga",
        "description": "Iconic Shonen, Seinen, Shojo, and serialized manga",
        "status": "active"
      },
      {
        "_id": "67cb1a48c4e365022dc70a92",
        "name": "Korean Manhwa",
        "description": "Vibrant full-color webtoons, fantasy rebirth, and romance",
        "status": "active"
      }
    ]
  }
  ```

#### `POST /api/categories` (Protected - Quyền: `admin`)
Tạo thể loại mới.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "name": "Audiobooks & Podcasts",
    "description": "Spoken word audiobooks and narrated dramatizations"
  }
  ```
- **Response mẫu (201 Created):**
  ```json
  {
    "message": "Category created successfully.",
    "category": {
      "_id": "67cc...",
      "name": "Audiobooks & Podcasts"
    }
  }
  ```

---

### 4.4. Cart (Giỏ hàng)

*Tất cả các route giỏ hàng đều yêu cầu đăng nhập.*

#### `GET /api/cart` (Protected)
Lấy thông tin giỏ hàng hiện tại của người dùng.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "cart": {
      "_id": "67ca...",
      "userId": "USR-1003",
      "items": [
        {
          "bookId": {
            "_id": "6a9f07d9df9b842a3fd80f88",
            "title": "One Piece, Vol. 1",
            "price": 9.99,
            "cover": "/images/books/hooky-1.jpg"
          },
          "quantity": 2,
          "price": 9.99
        }
      ],
      "updatedAt": "2026-09-08T02:30:00.000Z"
    }
  }
  ```

#### `POST /api/cart/items` (Protected)
Thêm sách vào giỏ hàng.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "bookId": "6a9f07d9df9b842a3fd80f88",
    "quantity": 1
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Item added to cart.",
    "cart": { ... }
  }
  ```

#### `PUT` hoặc `PATCH /api/cart/items` (Protected)
Cập nhật số lượng của một cuốn sách trong giỏ (nếu quantity = 0 sẽ tự xóa khỏi giỏ).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "bookId": "6a9f07d9df9b842a3fd80f88",
    "quantity": 3
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Cart updated.",
    "cart": { ... }
  }
  ```

#### `DELETE /api/cart/items/:bookId` (Protected)
Xóa một món sách khỏi giỏ hàng.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Item removed from cart.",
    "cart": { ... }
  }
  ```

---

### 4.5. Orders (Đặt hàng & Quản lý Đơn hàng)

#### `POST /api/orders` (Protected - Buyer/Seller/Admin)
Tạo đơn đặt hàng từ giỏ hàng hiện tại (Checkout).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "recipientName": "Nguyễn Văn A",
    "phone": "0912345678",
    "address": "123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM",
    "note": "Giao hàng vào giờ hành chính",
    "paymentMethod": "cod"
  }
  ```
- **Response mẫu (201 Created):**
  ```json
  {
    "message": "Order placed successfully!",
    "order": {
      "_id": "67cb3f28...",
      "orderCode": "ORD-1725764839",
      "userId": "USR-1003",
      "items": [
        {
          "bookId": "6a9f07d9df9b842a3fd80f88",
          "title": "One Piece, Vol. 1",
          "price": 9.99,
          "quantity": 2
        }
      ],
      "totalAmount": 19.98,
      "shippingAddress": {
        "recipientName": "Nguyễn Văn A",
        "phone": "0912345678",
        "address": "123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM"
      },
      "paymentMethod": "cod",
      "status": "pending",
      "createdAt": "2026-09-08T02:40:00.000Z"
    }
  }
  ```

#### `GET /api/orders/my-orders` (Protected - Buyer)
Lấy danh sách các đơn hàng của chính tài khoản đang đăng nhập.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "orders": [
      {
        "_id": "67cb3f28...",
        "orderCode": "ORD-1725764839",
        "totalAmount": 19.98,
        "status": "pending",
        "items": [ ... ],
        "createdAt": "2026-09-08T02:40:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/orders` (Protected - Quyền: `seller` hoặc `admin`)
Xem tất cả đơn hàng phát sinh (dành cho Admin và Seller theo dõi đơn hàng sản phẩm của họ).
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "orders": [ ... ]
  }
  ```

#### `PATCH /api/orders/:id/status` (Protected - Quyền: `seller` hoặc `admin`)
Cập nhật trạng thái tiến trình đơn hàng.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "status": "shipped"
  }
  ```
  *(Các giá trị status hợp lệ: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`)*
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Order status updated successfully.",
    "order": {
      "_id": "67cb3f28...",
      "status": "shipped"
    }
  }
  ```

---

### 4.6. Sổ địa chỉ giao hàng (Shipping Addresses)

#### `GET /api/users/addresses` (Protected)
Lấy danh sách các địa chỉ nhận hàng đã lưu của người dùng.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "addresses": [
      {
        "_id": "67cb44a1...",
        "recipientName": "Nguyễn Văn A",
        "phone": "0912345678",
        "address": "Tòa nhà Bitexco, Q1, TP.HCM",
        "isDefault": true
      }
    ]
  }
  ```

#### `POST /api/users/addresses` (Protected)
Thêm địa chỉ giao hàng mới vào hồ sơ.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "recipientName": "Nguyễn Văn A (Nhà riêng)",
    "phone": "0987654321",
    "address": "Số 12 Đường Hoa Mai, Phú Nhuận, TP.HCM",
    "isDefault": false
  }
  ```
- **Response mẫu (201 Created):**
  ```json
  {
    "message": "Address added successfully.",
    "addresses": [ ... ]
  }
  ```

#### `DELETE /api/users/addresses/:id` (Protected)
Xóa địa chỉ nhận hàng.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Address removed successfully.",
    "addresses": [ ... ]
  }
  ```

---

### 4.7. Quyền Seller & Dashboard

#### `POST /api/seller/request` (Protected - Customer)
Gửi đơn yêu cầu nâng cấp tài khoản lên Seller (Người bán sách).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "storeName": "Nhà Sách Tri Thức Trẻ",
    "reason": "Chúng tôi muốn kinh doanh các đầu sách công nghệ và kỹ năng mềm.",
    "contactInfo": "0912345678 - contact@trithuctre.vn"
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "Seller application submitted. Our team will review shortly."
  }
  ```

#### `GET /api/seller-dashboard` (Protected - Quyền: `seller`)
Lấy báo cáo tổng quan dành riêng cho người bán (doanh số, số đơn hàng, số sách đang bán).
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "totalRevenue": 1285.50,
    "totalOrders": 42,
    "totalBooks": 18,
    "recentOrders": [ ... ]
  }
  ```

---

### 4.8. Quản trị viên (Admin Routes)

#### `GET /api/admin/overview` (Protected - Quyền: `admin`)
Lấy số liệu phân tích toàn hệ thống (Tổng doanh thu, Tổng người dùng, Tổng số đơn, Tồn kho).
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "totalUsers": 125,
    "totalOrders": 350,
    "totalRevenue": 8420.00,
    "totalBooks": 105
  }
  ```

#### `GET /api/admin/users` (Protected - Quyền: `admin`)
Lấy danh sách người dùng trong hệ thống.
- **Headers:** `Authorization: Bearer <token>`
- **Response mẫu (200 OK):**
  ```json
  {
    "users": [
      {
        "userID": "USR-1001",
        "name": "Quản Trị Viên",
        "email": "admin@example.com",
        "role": "admin",
        "isBanned": false,
        "createdAt": "2026-09-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### `PATCH /api/admin/users/:userID/ban` (Protected - Quyền: `admin`)
Khóa hoặc mở khóa tài khoản người dùng.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "isBanned": true
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "User ban status updated successfully."
  }
  ```

#### `PATCH /api/admin/users/:userID/role` (Protected - Quyền: `admin`)
Thay đổi quyền hạn tài khoản (`customer`, `seller`, `admin`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body mẫu:**
  ```json
  {
    "role": "seller"
  }
  ```
- **Response mẫu (200 OK):**
  ```json
  {
    "message": "User role updated successfully."
  }
  ```

---

## 5. Quy chuẩn Mã lỗi HTTP (Error Handling)

Tất cả các response lỗi từ hệ thống đều trả về cấu trúc JSON thống nhất:
```json
{
  "message": "Mô tả nguyên nhân lỗi cụ thể"
}
```

### Các mã HTTP Status Code thông dụng:
| HTTP Code | Ý nghĩa | Ví dụ nguyên nhân |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Dữ liệu gửi lên không hợp lệ | Thiếu email, mật khẩu dưới 6 ký tự, số lượng tồn kho âm |
| **`401 Unauthorized`** | Chưa xác thực | Không gửi token, token hết hạn hoặc sai chữ ký |
| **`403 Forbidden`** | Không có quyền truy cập | Tài khoản bị khóa (`isBanned`), hoặc tài khoản `customer` cố gọi API của `admin` |
| **`404 Not Found`** | Không tìm thấy tài nguyên | ID sách không tồn tại, đơn hàng không tìm thấy |
| **`500 Internal Error`** | Lỗi máy chủ | Lỗi kết nối cơ sở dữ liệu MongoDB |
