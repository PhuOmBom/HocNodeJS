# Library Backend API - Day 9

Dự án Backend API quản lý sách và người dùng sử dụng **ExpressJS**, **Mongoose ODM (MongoDB)**, **JWT Authentication** và phân quyền theo vai trò (**Role-based Access Control - RBAC**).

---

## 1. Thông tin chung & Cấu hình

- **Base URL**: `http://localhost:3000`
- **Frontend URL hỗ trợ CORS**: `http://localhost:5173`
- **Định dạng dữ liệu**: `application/json`

### Cài đặt và khởi chạy

```bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo dữ liệu mẫu ban đầu (admin, user, books)
npm run seed

# 3. Khởi chạy server ở chế độ phát triển
npm run dev

# 4. Chạy kiểm thử tự động toàn diện
npm run test:api

# 5. Chạy demo kiểm tra JWT
npm run jwt-demo
```

### Tài khoản kiểm thử có sẵn sau khi chạy `npm run seed`:
| Vai trò (Role) | Email | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Admin** | `admin@gmail.com` | `admin123` | Toàn quyền: Xem, thêm, sửa, xóa sách |
| **User** | `user@gmail.com` | `user123` | Chỉ xem sách, xem thông tin cá nhân |

---

## 2. Cơ chế xác thực & Phân quyền (Authentication & Authorization)

### 2.1. Cách lấy Token khi Đăng nhập
Khi người dùng gọi API `POST /api/auth/login` thành công, server trả về `token` (JWT):

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "66b1f0b8e3c9a7d1a1234567",
      "name": "Quản trị viên (Admin)",
      "email": "admin@gmail.com",
      "role": "admin"
    }
  }
}
```
Client (ReactJS, Mobile app, Postman, etc.) lưu token này (thường lưu vào `localStorage` hoặc bộ nhớ state).

### 2.2. Cách gửi Token qua Authorization Header
Mọi request đến các route yêu cầu đăng nhập cần đính kèm header:
```http
Authorization: Bearer <token>
```

**Ví dụ gọi API bằng `fetch` trong JavaScript (ReactJS):**
```javascript
const token = localStorage.getItem("token");

const response = await fetch("http://localhost:3000/api/books", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({
    title: "Refactoring",
    author: "Martin Fowler",
    category: "Programming",
    available: true
  })
});

const data = await response.json();
console.log(data);
```

---

## 3. Danh sách Endpoint API

| Method | Endpoint | Mô tả | Quyền truy cập (Auth & Role) |
|---|---|---|---|
| `GET` | `/` | Kiểm tra trạng thái server | Public |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới (mặc định role `user`) | Public |
| `POST` | `/api/auth/login` | Đăng nhập lấy JWT token | Public |
| `GET` | `/api/auth/me` | Lấy thông tin user hiện tại | Cần đăng nhập (`Bearer token`) |
| `GET` | `/api/books` | Xem danh sách sách (hỗ trợ `?category=...`) | Public |
| `GET` | `/api/books/:id` | Xem chi tiết cuốn sách theo ID | Public |
| `POST` | `/api/books` | Thêm sách mới vào thư viện | **Chỉ Admin** (`authMiddleware` + `roleMiddleware`) |
| `PUT` | `/api/books/:id` | Chỉnh sửa thông tin sách | **Chỉ Admin** (`authMiddleware` + `roleMiddleware`) |
| `DELETE`| `/api/books/:id` | Xóa sách khỏi thư viện | **Chỉ Admin** (`authMiddleware` + `roleMiddleware`) |

---

## 4. Chi tiết Request & Response mẫu

### 4.1. Auth APIs

#### 1. Đăng ký tài khoản mới
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Request Body**:
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "password": "password123"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "_id": "67ce8b23f2a1b9c8d7e6f5a1",
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "role": "user",
    "createdAt": "2026-09-08T15:00:00.000Z",
    "updatedAt": "2026-09-08T15:00:00.000Z"
  }
}
```

#### 2. Đăng nhập
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Request Body**:
```json
{
  "email": "nguyenvana@gmail.com",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2NlOGIyM2YyYTFiOWM4ZDdlNmY1YTEiLCJlbWFpbCI6Im5ndXllbnZhbmFAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3ODg4NTgwMDAsImV4cCI6MTc4ODg2MTYwMH0...",
    "user": {
      "_id": "67ce8b23f2a1b9c8d7e6f5a1",
      "name": "Nguyễn Văn A",
      "email": "nguyenvana@gmail.com",
      "role": "user"
    }
  }
}
```

#### 3. Lấy thông tin user hiện tại
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "_id": "67ce8b23f2a1b9c8d7e6f5a1",
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "role": "user",
    "createdAt": "2026-09-08T15:00:00.000Z",
    "updatedAt": "2026-09-08T15:00:00.000Z"
  }
}
```
- **Response `401 Unauthorized`** (khi thiếu token hoặc token sai):
```json
{
  "success": false,
  "message": "Unauthorized: Token is missing or improperly formatted"
}
```

---

### 4.2. Books APIs

#### 1. Lấy danh sách tất cả sách
- **Method**: `GET`
- **Endpoint**: `/api/books`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67ce8c44f2a1b9c8d7e6f5b2",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "category": "Programming",
      "available": true,
      "createdBy": {
        "_id": "67ce8b23f2a1b9c8d7e6f5a0",
        "name": "Quản trị viên (Admin)",
        "email": "admin@gmail.com"
      },
      "createdAt": "2026-09-08T15:00:00.000Z",
      "updatedAt": "2026-09-08T15:00:00.000Z"
    }
  ]
}
```

#### 2. Lọc sách theo category (Bài tập về nhà 3)
- **Method**: `GET`
- **Endpoint**: `/api/books?category=Programming`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67ce8c44f2a1b9c8d7e6f5b2",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "category": "Programming",
      "available": true,
      "createdBy": {
        "_id": "67ce8b23f2a1b9c8d7e6f5a0",
        "name": "Quản trị viên (Admin)",
        "email": "admin@gmail.com"
      }
    }
  ]
}
```
*Lưu ý: Nếu không có cuốn sách nào khớp với category, API trả về mảng rỗng `[]`:*
```json
{
  "success": true,
  "data": []
}
```

#### 3. Lấy chi tiết một cuốn sách
- **Method**: `GET`
- **Endpoint**: `/api/books/:id`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "_id": "67ce8c44f2a1b9c8d7e6f5b2",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "category": "Programming",
    "available": true,
    "createdBy": {
      "_id": "67ce8b23f2a1b9c8d7e6f5a0",
      "name": "Quản trị viên (Admin)",
      "email": "admin@gmail.com"
    }
  }
}
```

#### 4. Thêm sách mới (Chỉ Admin - Bài tập về nhà 1 & 2)
- **Method**: `POST`
- **Endpoint**: `/api/books`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "title": "JavaScript: The Good Parts",
  "author": "Douglas Crockford",
  "category": "Programming",
  "available": true
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "_id": "67ce8da1f2a1b9c8d7e6f5c3",
    "title": "JavaScript: The Good Parts",
    "author": "Douglas Crockford",
    "category": "Programming",
    "available": true,
    "createdBy": "67ce8b23f2a1b9c8d7e6f5a0",
    "createdAt": "2026-09-08T15:05:00.000Z",
    "updatedAt": "2026-09-08T15:05:00.000Z"
  }
}
```
- **Response `403 Forbidden`** (khi user thông thường cố tình thêm):
```json
{
  "success": false,
  "message": "Forbidden: You do not have permission to perform this action"
}
```

#### 5. Cập nhật thông tin sách (Chỉ Admin)
- **Method**: `PUT`
- **Endpoint**: `/api/books/:id`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "available": false
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "_id": "67ce8da1f2a1b9c8d7e6f5c3",
    "title": "JavaScript: The Good Parts",
    "author": "Douglas Crockford",
    "category": "Programming",
    "available": false
  }
}
```

#### 6. Xóa sách (Chỉ Admin)
- **Method**: `DELETE`
- **Endpoint**: `/api/books/:id`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "message": "Book deleted successfully"
  }
}
```
- **Response `403 Forbidden`** (khi user thông thường cố tình xóa):
```json
{
  "success": false,
  "message": "Forbidden: You do not have permission to perform this action"
}
```
