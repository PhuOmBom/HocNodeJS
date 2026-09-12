# BÀI TẬP TỔNG HỢP: HỆ THỐNG REST API QUẢN LÝ NHÂN SỰ (HR MANAGEMENT SYSTEM)

Dự án Backend RESTful API hoàn chỉnh theo đúng đặc tả yêu cầu của [BÀI TẬP TỔNG HỢP](https://hackmd.io/@kb9Gxj4xSGmnr5aPH63w7A/rJrfXd6dfe) bao gồm:
* **Bài 1**: Authentication, Phân quyền JWT, Quản lý Phòng ban, Quản lý Chức vụ.
* **Bài 2**: Quản lý Nhân viên (tìm kiếm, lọc, sắp xếp, phân trang), Chấm công (Check-in/Check-out), Đơn nghỉ phép (Gửi, xem, duyệt/từ chối), Xóa mềm dữ liệu.
* **Bài 3**: Hồ sơ cá nhân (Xem, cập nhật, đổi mật khẩu), Thống kê cơ bản (Tổng quan, theo phòng ban, theo chức vụ), Lọc sinh nhật / thử việc, Xuất danh sách nhân viên (JSON/CSV).

---

## 1. Công Nghệ Sử Dụng

- **Runtime & Framework**: Node.js, ExpressJS
- **Cơ sở dữ liệu**: MongoDB qua ODM Mongoose
- **Xác thực & Mã hóa**: JSON Web Token (`jsonwebtoken`), `bcrypt`
- **Tiện ích**: `dotenv`, `cors`, `morgan`, `nodemon`

---

## 2. Cấu Trúc Thư Mục Chuẩn

```txt
src/
  config/
    db.js
  controllers/
    auth.controller.js
    department.controller.js
    position.controller.js
    employee.controller.js
    attendance.controller.js
    leave.controller.js
    profile.controller.js
    statistic.controller.js
  middlewares/
    auth.middleware.js
    role.middleware.js
    error.middleware.js
  models/
    User.js
    Department.js
    Position.js
    Employee.js
    Attendance.js
    Leave.js
  routes/
    auth.routes.js
    department.routes.js
    position.routes.js
    employee.routes.js
    attendance.routes.js
    leave.routes.js
    profile.routes.js
    statistic.routes.js
  utils/
    generateToken.js
    pagination.js
    exportCsv.js
  app.js
  server.js
.env.example
package.json
README.md
```

---

## 3. Cài Đặt & Khởi Chạy

### A. Cài đặt thư viện
```bash
npm install
```

### B. Biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc dự án (tham khảo `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hr_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### C. Khởi chạy Server
```bash
# Chế độ phát triển (Development với Nodemon)
npm run dev

# Chế độ Production
npm start
```

### D. Chạy kiểm thử tự động toàn diện
```bash
node test-api.js
```

---

## 4. Danh Sách Endpoint REST API Đầy Đủ

### A. Authentication (`/api/auth`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản | Public |
| `POST` | `/api/auth/login` | Đăng nhập lấy JWT Token | Public |
| `GET` | `/api/auth/me` | Lấy thông tin user hiện tại | Đã đăng nhập |

### B. Hồ Sơ Cá Nhân (`/api/profile`) - Bài 3
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/profile` | Xem hồ sơ cá nhân | admin, hr, staff |
| `PUT` | `/api/profile` | Cập nhật hồ sơ cá nhân | admin, hr, staff |
| `PATCH` | `/api/profile/change-password` | Đổi mật khẩu | admin, hr, staff |

### C. Quản Lý Phòng Ban (`/api/departments`) - Bài 1
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/departments` | Lấy danh sách phòng ban | admin, hr, staff |
| `GET` | `/api/departments/:id` | Lấy chi tiết phòng ban | admin, hr, staff |
| `POST` | `/api/departments` | Thêm phòng ban | admin, hr |
| `PUT` | `/api/departments/:id` | Cập nhật phòng ban | admin, hr |
| `DELETE` | `/api/departments/:id` | Xóa mềm phòng ban (chặn nếu còn nhân viên) | admin |

### D. Quản Lý Chức Vụ (`/api/positions`) - Bài 1
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/positions` | Lấy danh sách chức vụ | admin, hr, staff |
| `GET` | `/api/positions/:id` | Lấy chi tiết chức vụ | admin, hr, staff |
| `POST` | `/api/positions` | Thêm chức vụ | admin, hr |
| `PUT` | `/api/positions/:id` | Cập nhật chức vụ | admin, hr |
| `DELETE` | `/api/positions/:id` | Xóa mềm chức vụ (chặn nếu còn nhân viên) | admin |

### E. Quản Lý Nhân Viên (`/api/employees`) - Bài 2 & Bài 3
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/employees` | Danh sách nhân viên (lọc, tìm kiếm, sắp xếp, phân trang) | admin, hr, staff |
| `GET` | `/api/employees/birthdays` | Nhân viên có sinh nhật trong tháng (`?month=3`) | admin, hr |
| `GET` | `/api/employees/probation-ending` | Nhân viên sắp hết thử việc (`?days=7`) | admin, hr |
| `GET` | `/api/employees/export` | Xuất danh sách nhân viên (`?format=json|csv`) | admin, hr |
| `GET` | `/api/employees/:id` | Xem chi tiết nhân viên (kèm populate) | admin, hr, staff |
| `POST` | `/api/employees` | Thêm nhân viên | admin, hr |
| `PUT` | `/api/employees/:id` | Cập nhật nhân viên | admin, hr |
| `DELETE` | `/api/employees/:id` | Xóa mềm nhân viên (`status: 'resigned'`) | admin |

### F. Chấm Công (`/api/attendances`) - Bài 2
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/attendances/check-in` | Check-in (1 lần/ngày) | admin, hr, staff |
| `POST` | `/api/attendances/check-out` | Check-out (tự tính workingHours) | admin, hr, staff |
| `GET` | `/api/attendances` | Xem toàn bộ dữ liệu chấm công | admin, hr |
| `GET` | `/api/attendances/me` | Xem chấm công của bản thân | admin, hr, staff |
| `GET` | `/api/attendances/employee/:employeeId` | Xem chấm công của một nhân viên | admin, hr |

### G. Nghỉ Phép (`/api/leaves`) - Bài 2
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/leaves` | Gửi đơn nghỉ phép (mặc định pending) | admin, hr, staff |
| `GET` | `/api/leaves` | Xem toàn bộ đơn nghỉ | admin, hr |
| `GET` | `/api/leaves/me` | Xem đơn nghỉ của bản thân | admin, hr, staff |
| `GET` | `/api/leaves/:id` | Xem chi tiết đơn nghỉ | admin, hr, chủ đơn |
| `PATCH` | `/api/leaves/:id/approve` | Duyệt đơn nghỉ (chỉ khi pending) | admin, hr |
| `PATCH` | `/api/leaves/:id/reject` | Từ chối đơn nghỉ (chỉ khi pending) | admin, hr |

### H. Thống Kê Cơ Bản (`/api/statistics`) - Bài 3
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/statistics/overview` | Thống kê tổng quan nhân sự | admin, hr |
| `GET` | `/api/statistics/departments` | Thống kê nhân viên theo phòng ban | admin, hr |
| `GET` | `/api/statistics/positions` | Thống kê nhân viên theo chức vụ | admin, hr |

---

## 5. Quy Chuẩn Đáp Ứng Nghiệp Vụ

1. **Bảo mật & Phân quyền**:
   - `auth.middleware.js`: Kiểm tra Bearer token trong header `Authorization`.
   - `role.middleware.js`: Trả về lỗi 403 đúng mẫu: `{"message": "Bạn không có quyền thực hiện chức năng này"}` khi sai quyền.
2. **Xử lý lỗi tập trung**:
   - `error.middleware.js`: Chuẩn hóa lỗi `ValidationError` trả về status 400 kèm mảng `errors: [...]`.
3. **Chính sách dữ liệu**:
   - Không xóa cứng dữ liệu (`hard delete`), mọi thao tác xóa đều là xóa mềm (`soft delete`).
   - Phòng ban và chức vụ chỉ cho phép xóa mềm khi không còn nhân viên nào liên kết.
4. **Chấm công & Nghỉ phép**:
   - Một nhân viên chỉ check-in 1 lần/ngày; chỉ được check-out sau khi đã check-in; tự động tính `workingHours`.
   - Đơn nghỉ phép khi được duyệt (`approved`) sẽ tự động cập nhật bản ghi chấm công `status: 'leave'` cho các ngày tương ứng.
