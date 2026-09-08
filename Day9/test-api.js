require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");

let server;
const PORT = 3001; // Sử dụng port riêng cho test
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN DAY 9 API ===\n");

  await connectDB();
  server = app.listen(PORT);
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // 1. Kiểm tra Server Root
    const rootRes = await request("/");
    assert(rootRes.status === 200 && rootRes.data.success === true, "GET / -> 200 OK");

    // 2. Đăng ký tài khoản người dùng mới (Kiểm tra role mặc định là 'user' - Bài 1)
    const uniqueEmail = `student_${Date.now()}@gmail.com`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: {
        name: "Học Viên Mới",
        email: uniqueEmail,
        password: "password123",
      },
    });
    assert(regRes.status === 201, "POST /api/auth/register -> 201 Created");
    assert(regRes.data.data.role === "user", "User đăng ký mới có role mặc định là 'user' (Bài 1)");
    assert(regRes.data.data.password === undefined, "Response đăng ký không lộ password");

    // 3. Đăng nhập với User thường
    const userLoginRes = await request("/api/auth/login", {
      method: "POST",
      body: {
        email: uniqueEmail,
        password: "password123",
      },
    });
    assert(userLoginRes.status === 200, "POST /api/auth/login (User) -> 200 OK");
    const userToken = userLoginRes.data.data.token;
    assert(!!userToken, "Login trả về token hợp lệ");

    // 4. Đăng nhập với Admin
    const adminLoginRes = await request("/api/auth/login", {
      method: "POST",
      body: {
        email: "admin@gmail.com",
        password: "admin123",
      },
    });
    assert(adminLoginRes.status === 200, "POST /api/auth/login (Admin) -> 200 OK");
    const adminToken = adminLoginRes.data.data.token;
    assert(adminLoginRes.data.data.user.role === "admin", "Admin login trả về role 'admin'");

    // 5. Kiểm tra GET /api/auth/me không có token -> 401 Unauthorized
    const meNoToken = await request("/api/auth/me");
    assert(meNoToken.status === 401, "GET /api/auth/me không có token -> 401 Unauthorized");

    // 6. Kiểm tra GET /api/auth/me có token -> 200 OK
    const meWithToken = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(meWithToken.status === 200, "GET /api/auth/me có token -> 200 OK");
    assert(meWithToken.data.data.email === uniqueEmail, "GET /api/auth/me trả đúng thông tin user");

    // 7. GET /api/books (Public route)
    const booksRes = await request("/api/books");
    assert(booksRes.status === 200 && Array.isArray(booksRes.data.data), "GET /api/books -> 200 và mảng sách");
    const initialCount = booksRes.data.data.length;
    console.log(`   (Hiện có ${initialCount} cuốn sách)`);

    // 8. Bài 3: GET /api/books?category=Programming
    const progBooksRes = await request("/api/books?category=Programming");
    assert(progBooksRes.status === 200, "GET /api/books?category=Programming -> 200 OK");
    assert(
      progBooksRes.data.data.length > 0 &&
        progBooksRes.data.data.every((b) => b.category.toLowerCase() === "programming"),
      "Tất cả sách lọc được đều thuộc category 'Programming' (Bài 3)"
    );

    // 9. Bài 3: GET /api/books?category=NonExistent -> Mảng rỗng []
    const emptyCatRes = await request("/api/books?category=KhongTonTai123");
    assert(
      emptyCatRes.status === 200 && Array.isArray(emptyCatRes.data.data) && emptyCatRes.data.data.length === 0,
      "GET /api/books?category=... không có dữ liệu trả về mảng rỗng [] (Bài 3)"
    );

    // 10. POST /api/books không có token -> 401
    const createNoToken = await request("/api/books", {
      method: "POST",
      body: { title: "Test Book", author: "Tester" },
    });
    assert(createNoToken.status === 401, "POST /api/books không token -> 401 Unauthorized");

    // 11. Bài 1 & 2: POST /api/books với User thường -> 403 Forbidden
    const createAsUser = await request("/api/books", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { title: "User Book", author: "Normal User" },
    });
    assert(
      createAsUser.status === 403,
      "POST /api/books với User thường -> 403 Forbidden (Chỉ admin mới được tạo - Bài 1 & 2)"
    );

    // 12. Bài 1 & 2: POST /api/books với Admin -> 201 Created
    const createAsAdmin = await request("/api/books", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: "Node.js Design Patterns",
        author: "Mario Casciaro",
        category: "Programming",
        available: true,
      },
    });
    assert(createAsAdmin.status === 201, "POST /api/books với Admin -> 201 Created (Bài 1 & 2)");
    const createdBookId = createAsAdmin.data.data._id;

    // 13. PUT /api/books/:id với User thường -> 403 Forbidden
    const updateAsUser = await request(`/api/books/${createdBookId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { title: "Hacked Title" },
    });
    assert(updateAsUser.status === 403, "PUT /api/books/:id với User thường -> 403 Forbidden (Bài 1 & 2)");

    // 14. PUT /api/books/:id với Admin -> 200 OK
    const updateAsAdmin = await request(`/api/books/${createdBookId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { available: false },
    });
    assert(
      updateAsAdmin.status === 200 && updateAsAdmin.data.data.available === false,
      "PUT /api/books/:id với Admin -> 200 OK và đã cập nhật (Bài 1 & 2)"
    );

    // 15. DELETE /api/books/:id với User thường -> 403 Forbidden
    const deleteAsUser = await request(`/api/books/${createdBookId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(deleteAsUser.status === 403, "DELETE /api/books/:id với User thường -> 403 Forbidden (Bài 1 & 2)");

    // 16. DELETE /api/books/:id với Admin -> 200 OK
    const deleteAsAdmin = await request(`/api/books/${createdBookId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteAsAdmin.status === 200, "DELETE /api/books/:id với Admin -> 200 OK (Xóa thành công)");

    // 17. GET book vừa xóa -> 404
    const getDeleted = await request(`/api/books/${createdBookId}`);
    assert(getDeleted.status === 404, "GET /api/books/:id đã xóa -> 404 Not Found");

    console.log("\n🎉 TẤT CẢ 17/17 BÀI TEST ĐÃ HOÀN TOÀN THÀNH CÔNG!\n");
  } finally {
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  if (server) server.close();
  process.exit(1);
});
