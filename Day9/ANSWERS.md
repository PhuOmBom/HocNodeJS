# LỜI GIẢI BÀI TẬP LÝ THUYẾT & CÂU HỎI ÔN TẬP - BUỔI 09

---

## I. Lời giải các Bài tập nhỏ trong bài học

### Bài tập nhỏ 1 (Mục 1)
**Đề bài:** Đánh dấu API nào cần JWT và giải thích ngắn lý do:

1. `POST /api/auth/login`
   - **Cần JWT?** ❌ **Không**
   - **Lý do:** Đây là API công khai (public) để người dùng gửi email/mật khẩu lên xác thực và nhận về token. Nếu bắt token ở đây thì người chưa đăng nhập không bao giờ vào được.
2. `GET /api/books`
   - **Cần JWT?** ❌ **Không** (hoặc tùy dự án, ở bài này là Public)
   - **Lý do:** Khách ghé thăm ứng dụng cần xem danh mục các đầu sách trước khi quyết định mượn hoặc đăng ký tài khoản.
3. `POST /api/books`
   - **Cần JWT?** ✅ **Có**
   - **Lý do:** Thao tác thêm dữ liệu mới vào hệ thống cần biết chính xác ai đang thực hiện (`createdBy`) và phải xác minh quyền quản trị (`admin`).
4. `GET /api/auth/me`
   - **Cần JWT?** ✅ **Có**
   - **Lý do:** Server cần đọc JWT để biết người gửi request là user nào (`userId`), từ đó truy vấn database trả về thông tin cá nhân của người đó.
5. `DELETE /api/books/:id`
   - **Cần JWT?** ✅ **Có**
   - **Lý do:** Xóa sách là thao tác nguy hiểm có khả năng mất dữ liệu, bắt buộc phải có token và quyền `admin` mới được thực thi.

---

### Bài tập nhỏ 2 (Mục 2)
**Đề bài:** Cho payload sau:
```json
{
  "userId": "u01",
  "email": "student@example.com",
  "password": "123456",
  "role": "admin"
}
```

1. **Field không nên đưa vào JWT payload:**
   - Field `password` tuyệt đối **không được** đưa vào JWT payload.
   - **Lý do:** Payload của JWT chỉ được mã hóa Base64Url chứ không hề mã hóa bảo mật (không encrypt). Bất kỳ ai chặn hoặc có được token đều giải mã (decode) được payload ngay lập tức.
2. **Viết lại payload phù hợp:**
```json
{
  "userId": "u01",
  "email": "student@example.com",
  "role": "admin"
}
```
3. **Giải thích ngắn vai trò của Signature:**
   - Signature (chữ ký số) được tạo bằng cách băm kết hợp Header + Payload cùng với một chuỗi khóa bí mật (`JWT_SECRET`).
   - Vai trò: Giúp Server xác minh tính toàn vẹn của dữ liệu và phát hiện token có bị làm giả hay chỉnh sửa không. Nếu kẻ xấu tự ý sửa payload (ví dụ sửa role từ `user` thành `admin`), signature sẽ không khớp và server lập tức từ chối token.

---

### Bài tập nhỏ 5 (Mục 5)
**Đề bài:** Xác định các field cần có cho model `Book`:

| Tên Field | Kiểu dữ liệu | Bắt buộc (required) | Default value | Ghi chú |
|---|---|:---:|:---:|---|
| `title` | `String` | Có (`true`) | Không | Tên sách, trim khoảng trắng |
| `author` | `String` | Có (`true`) | Không | Tác giả, trim khoảng trắng |
| `category` | `String` | Không | `"General"` | Thể loại sách |
| `available` | `Boolean` | Không | `true` | Trạng thái sẵn sàng cho mượn |
| `createdBy` | `ObjectId` (`ref: "User"`) | Không | Không | ID của User/Admin đã tạo sách |
| `createdAt` | `Date` (timestamps) | Tự động | Thời điểm hiện tại | Do timestamps sinh ra |
| `updatedAt` | `Date` (timestamps) | Tự động | Thời điểm hiện tại | Do timestamps sinh ra |

---

## II. Trả lời 13 Câu hỏi ôn tập cuối bài

### 1. JWT dùng để giải quyết vấn đề gì?
- Giao thức HTTP là **stateless** (không lưu trạng thái giữa các request). Server không tự nhớ request tiếp theo là của ai.
- JWT giải quyết bài toán xác thực (Authentication) và phân quyền (Authorization) bằng cách cấp cho client một chuỗi token sau khi đăng nhập. Client sẽ gửi token này kèm mỗi request để server nhận diện danh tính mà không cần lưu session trong RAM server.

### 2. JWT gồm những phần nào?
Gồm 3 phần phân tách nhau bởi dấu chấm (`.`): `header.payload.signature`
- **Header:** Chứa thông tin thuật toán ký (vd: `HS256`) và loại token (`JWT`).
- **Payload:** Chứa các claims (thông tin định danh như `userId`, `email`, `role`, thời hạn `exp`).
- **Signature:** Chữ ký số tạo từ Header, Payload và Secret Key để đảm bảo token không bị giả mạo.

### 3. Vì sao không lưu password trong JWT payload?
- Payload chỉ được mã hóa dạng **Base64Url** (ai cũng giải mã đọc được dễ dàng qua các trang như `jwt.io`).
- Nếu lưu password, kẻ tấn công hoặc bất kỳ bên thứ ba nào thấy token sẽ đọc được mật khẩu của người dùng.

### 4. Signature trong JWT dùng để làm gì?
- Đảm bảo **tính toàn vẹn (integrity)** và **tính xác thực (authenticity)**.
- Giúp server nhận biết token do chính server sinh ra hay bị kẻ xấu sửa đổi nội dung payload.

### 5. Client gửi JWT lên backend bằng header nào?
Gửi qua header HTTP chuẩn:
```http
Authorization: Bearer <token>
```

### 6. `jwt.sign()` và `jwt.verify()` khác nhau như thế nào?
- `jwt.sign(payload, secret, options)`: Dùng ở chiều **tạo ra token** sau khi user đăng nhập hợp lệ.
- `jwt.verify(token, secret)`: Dùng ở chiều **kiểm tra tính hợp lệ của token** khi có request gửi tới; nếu hợp lệ sẽ trả về decoded payload, nếu hết hạn hoặc sai chữ ký sẽ ném ra Exception/Error.

### 7. Mongoose khác MongoDB Driver ở điểm nào?
- **MongoDB Driver:** Làm việc mức cấp thấp (low-level), thao tác trực tiếp với collections, không ép buộc schema, lập trình viên phải tự viết mã validation thủ công. Thích hợp cho các thao tác đơn giản hoặc tác vụ hiệu năng cao đặc thù.
- **Mongoose (ODM):** Cung cấp mô hình hướng đối tượng, định nghĩa Schema chặt chẽ, hỗ trợ validation tự động, middleware (hooks), populate liên kết giữa các bảng, giúp code backend có cấu trúc và dễ bảo trì hơn.

### 8. Schema trong Mongoose dùng để làm gì?
- Định nghĩa cấu trúc (bản vẽ kỹ thuật) cho Document trong MongoDB: kiểu dữ liệu của các field, các ràng buộc (required, unique, minlength), giá trị mặc định (default), và các quy tắc kiểm tra tính hợp lệ của dữ liệu trước khi lưu vào database.

### 9. Vì sao cần hash password trước khi lưu vào database?
- Để bảo vệ mật khẩu người dùng ngay cả khi cơ sở dữ liệu bị lộ lọt (data breach).
- Sử dụng các thuật toán hashing một chiều có salt như `bcrypt` để hacker không thể dịch ngược trực tiếp ra mật khẩu gốc.

### 10. Auth middleware có vai trò gì?
- Đóng vai trò là "người gác cổng" chặn trước các Controller của các route cần bảo vệ:
  1. Kiểm tra request có gửi header `Authorization: Bearer <token>` hay không.
  2. Xác thực tính hợp lệ của token qua `jwt.verify()`.
  3. Gắn thông tin người dùng (`req.user = decoded`) để các middleware và controller tiếp theo sử dụng.
  4. Nếu token không hợp lệ hoặc thiếu, lập tức phản hồi mã lỗi `401 Unauthorized`.

### 11. Vì sao route thêm, sửa, xóa sách nên cần JWT?
- **Trách nhiệm dữ liệu:** Cần biết chính xác sách do ai tạo (`createdBy`) để phục vụ kiểm toán hoặc ghi nhận.
- **Bảo mật & Phân quyền:** Ngăn chặn người dùng lạ hoặc người dùng không có thẩm quyền tùy tiện chỉnh sửa hoặc xóa sạch dữ liệu của hệ thống.

### 12. Vì sao nên chia project thành route, controller, service và model?
Tuân thủ nguyên lý **Single Responsibility** và mô hình phân tầng chuẩn trong công nghệ phần mềm:
- **Routes:** Chỉ định tuyến URL và HTTP methods.
- **Controllers:** Nhận HTTP request, trích xuất tham số, gọi services và trả HTTP response (mã trạng thái, format JSON).
- **Services:** Chứa logic nghiệp vụ thuần túy (business logic), độc lập với HTTP, dễ dàng viết Unit Test.
- **Models:** Định nghĩa cấu trúc dữ liệu và tương tác trực tiếp với Database qua Mongoose.

### 13. ReactJS frontend sẽ gửi token lên backend bằng cách nào?
- Khi user đăng nhập thành công, ReactJS nhận JWT và lưu vào `localStorage` hoặc `sessionStorage` (vd: `localStorage.setItem("token", data.token)`).
- Khi gọi các API bảo vệ, ReactJS dùng `fetch` hoặc `axios` chèn header `Authorization: Bearer ${localStorage.getItem("token")}` vào cấu hình request.
