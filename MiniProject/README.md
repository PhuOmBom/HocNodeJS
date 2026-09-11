# Hệ Thống API Quản Lý Nhân Sự & Chấm Công (HR Management System)

Dự án Backend RESTful API hoàn chỉnh phục vụ bài toán quản lý doanh nghiệp: Nhân sự, Phòng ban, Chức vụ, Điểm danh chấm công, Đơn xin nghỉ phép và Thống kê tổng quan.

---

## 1. Công Nghệ Sử Dụng

- **Runtime & Framework**: Node.js, Express.js (v5)
- **Database**: MongoDB Atlas / MongoDB Local qua ODM Mongoose (v8)
- **Bảo mật & Xác thực**: JSON Web Token (`jsonwebtoken`), Mã hóa mật khẩu Salt & Hash (`bcrypt`)
- **Phân quyền (RBAC)**: Phân quyền theo 3 vai trò: `admin`, `hr`, `staff`
- **Tiện ích**: `cors`, `morgan`, `dotenv`, `nodemon`

---

## 2. Hướng Dẫn Cài Đặt & Khởi Chạy

### A. Cài đặt thư viện
```bash
npm install
```

### B. Cấu hình biến môi trường (`.env`)
File `.env` được đặt tại thư mục gốc của dự án:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/miniproject_hr
JWT_SECRET=super_secret_hr_jwt_key_2026_miniproject
JWT_EXPIRES_IN=7d
```

### C. Khởi tạo dữ liệu mẫu (Seed Data)
Lệnh tạo sẵn các phòng ban, chức vụ, tài khoản mẫu và chấm công:
```bash
npm run seed
```

### D. Khởi chạy Server
```bash
# Chế độ phát triển (Tự reload khi sửa code)
npm run dev

# Chạy server thông thường
npm start
```

### E. Chạy kiểm thử tự động toàn diện (Automated Tests)
```bash
npm test
# hoặc
npm run test-api
```

---

## 3. Danh Sách Tài Khoản Mẫu Có Sẵn

Sau khi chạy lệnh `npm run seed`, hệ thống đã có sẵn 3 tài khoản với mật khẩu mặc định: **`password123`**:

| Vai trò (Role) | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hr.com` | `password123` | Toàn quyền quản trị hệ thống, phòng ban, chức vụ, nhân sự |
| **HR** | `hr@hr.com` | `password123` | Quản lý nhân viên, chấm công, xét duyệt đơn xin nghỉ phép |
| **Staff** | `staff@hr.com` | `password123` | Điểm danh vào/ra ca, nộp đơn xin nghỉ, xem lịch sử cá nhân |

---

## 4. Cách Gửi Token Xác Thực

Đối với các endpoint yêu cầu đăng nhập, đính kèm Token nhận được từ API login vào HTTP Header:

```http
Authorization: Bearer <access_token_cua_ban>
```

---

## 5. Danh Sách Endpoint RESTful API

### A. Xác thực & Tài khoản (`/api/auth`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản (mặc định role `staff`) |
| `POST` | `/api/auth/login` | Public | Đăng nhập lấy JWT Token & thông tin User |
| `GET` | `/api/auth/me` | Đã đăng nhập | Lấy thông tin hồ sơ tài khoản hiện tại |
| `PUT` | `/api/auth/change-password` | Đã đăng nhập | Đổi mật khẩu tài khoản |

#### Request body mẫu: Đăng nhập (`POST /api/auth/login`)
```json
{
  "email": "admin@hr.com",
  "password": "password123"
}
```

#### Response mẫu (200 OK):
```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "_id": "6aa447d6d34e2b0012345678",
    "fullName": "Quản trị viên Hệ thống (Admin)",
    "email": "admin@hr.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

### B. Quản lý Phòng ban (`/api/departments`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | Đã đăng nhập | Danh sách phòng ban (kèm số lượng nhân viên) |
| `GET` | `/api/departments/:id` | Đã đăng nhập | Chi tiết phòng ban và danh sách nhân sự |
| `POST` | `/api/departments` | `admin`, `hr` | Thêm phòng ban mới |
| `PUT` | `/api/departments/:id` | `admin`, `hr` | Cập nhật thông tin phòng ban |
| `DELETE` | `/api/departments/:id` | `admin` | Xóa phòng ban (kiểm tra an toàn nhân sự) |

---

### C. Quản lý Chức vụ (`/api/positions`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/positions` | Đã đăng nhập | Danh sách chức vụ và mức lương cơ bản |
| `GET` | `/api/positions/:id` | Đã đăng nhập | Chi tiết chức vụ và danh sách nhân sự |
| `POST` | `/api/positions` | `admin`, `hr` | Thêm chức vụ mới |
| `PUT` | `/api/positions/:id` | `admin`, `hr` | Cập nhật thông tin chức vụ |
| `DELETE` | `/api/positions/:id` | `admin` | Xóa chức vụ |

---

### D. Quản lý Hồ sơ Nhân sự (`/api/employees`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Đã đăng nhập | Danh sách nhân viên (hỗ trợ search, filter, pagination) |
| `GET` | `/api/employees/:id` | Đã đăng nhập | Chi tiết nhân viên, lịch sử chấm công & nghỉ phép |
| `POST` | `/api/employees` | `admin`, `hr` | Tạo mới nhân viên (tự sinh mã nhân viên nếu để trống) |
| `PUT` | `/api/employees/:id` | `admin`, `hr` | Cập nhật thông tin hồ sơ nhân viên |
| `DELETE` | `/api/employees/:id` | `admin` | Đánh dấu nghỉ việc (`resigned`) hoặc xóa vĩnh viễn (`?hardDelete=true`) |

#### Request body mẫu: Thêm nhân viên (`POST /api/employees`)
```json
{
  "fullName": "Trần Quốc Toản",
  "email": "toan.tran@hr.com",
  "phone": "0987112233",
  "gender": "male",
  "dateOfBirth": "1997-04-12",
  "address": "123 Hai Bà Trưng, Quận 3, TP.HCM",
  "departmentId": "6aa447d7d34e2b0012345680",
  "positionId": "6aa447d7d34e2b0012345685",
  "salary": 25000000,
  "status": "probation"
}
```

---

### E. Điểm danh & Chấm công (`/api/attendances`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendances/check-in` | Đã đăng nhập | Điểm danh vào ca (tự động phân loại đúng giờ/đi muộn sau 08:30) |
| `POST` | `/api/attendances/check-out` | Đã đăng nhập | Điểm danh ra ca (tự động tính tổng số giờ làm việc) |
| `GET` | `/api/attendances/my-attendance` | Đã đăng nhập | Xem lịch sử chấm công của chính mình |
| `GET` | `/api/attendances` | `admin`, `hr` | Xem danh sách chấm công toàn công ty (lọc theo ngày/tháng) |

---

### F. Quản lý Nghỉ phép (`/api/leaves`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leaves` | Đã đăng nhập | Nộp đơn xin nghỉ phép (`annual`, `sick`, `unpaid`) |
| `GET` | `/api/leaves/my-leaves` | Đã đăng nhập | Xem danh sách đơn xin nghỉ của cá nhân |
| `GET` | `/api/leaves` | `admin`, `hr` | Xem danh sách đơn xin nghỉ toàn công ty |
| `PATCH` | `/api/leaves/:id/status` | `admin`, `hr` | Phê duyệt (`approved`) hoặc từ chối (`rejected`) đơn |
| `DELETE` | `/api/leaves/:id` | Đã đăng nhập | Hủy đơn xin nghỉ khi còn ở trạng thái `pending` |

---

### G. Thống kê Bảng điều khiển (`/api/dashboard`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | `admin`, `hr` | Lấy số liệu tổng quan: nhân sự, phòng ban, đi làm hôm nay, đơn chờ duyệt |

#### Response mẫu: Thống kê Dashboard (`GET /api/dashboard/stats`)
```json
{
  "success": true,
  "summary": {
    "employees": {
      "total": 4,
      "active": 3,
      "probation": 1,
      "resigned": 0
    },
    "departments": 4,
    "positions": 5,
    "attendanceToday": {
      "totalCheckedIn": 3,
      "present": 2,
      "late": 1,
      "onLeave": 0
    },
    "pendingLeaveRequests": 1
  }
}
```
