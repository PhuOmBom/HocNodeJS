const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const courses = [
  { id: 1, name: "HTML & CSS", price: 1500000 },
  { id: 2, name: "JavaScript", price: 2500000 },
  { id: 3, name: "Node.js", price: 3000000 }
];

let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

function page(title, content) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/">Trang chủ</a>
    <a href="/courses">Khóa học</a>
    <a href="/register">Đăng ký</a>
    <a href="/stats">Thống kê</a>
  </nav>
  <main>${content}</main>
</body>
</html>`;
}

app.get("/", (req, res) => {
  res.send(page("Đăng ký khóa học", `
    <h1>Đăng ký khóa học</h1>
    <p>Chào mừng bạn đến với trang đăng ký khóa học.</p>
    <a class="button" href="/courses">Xem các khóa học</a>
  `));
});

app.get("/courses", (req, res) => {
  const courseList = courses.map((course) => `
    <article class="course">
      <h2>${course.name}</h2>
      <p>Học phí: ${course.price.toLocaleString("vi-VN")} VNĐ</p>
      <a href="/courses/${course.id}">Xem chi tiết</a>
    </article>
  `).join("");

  res.send(page("Danh sách khóa học", `
    <h1>Danh sách khóa học</h1>
    <section class="course-list">${courseList}</section>
  `));
});

app.get("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find((item) => item.id === id);

  if (!course) {
    return res.status(404).send("Course not found");
  }

  res.send(page(course.name, `
    <h1>${course.name}</h1>
    <p>Học phí: ${course.price.toLocaleString("vi-VN")} VNĐ</p>
    <a class="button" href="/register">Đăng ký khóa học này</a>
  `));
});

app.get("/register", (req, res) => {
  const options = courses.map((course) =>
    `<option value="${course.name}">${course.name}</option>`
  ).join("");

  res.send(page("Đăng ký khóa học", `
    <h1>Đăng ký khóa học</h1>
    <form action="/register" method="post">
      <label for="name">Họ tên</label>
      <input id="name" name="name" placeholder="Tên của bạn" required>

      <label for="email">Email</label>
      <input id="email" name="email" type="email" placeholder="Email của bạn" required>

      <label for="course">Khóa học</label>
      <select id="course" name="course">${options}</select>

      <button type="submit">Đăng ký</button>
    </form>
  `));
});

app.post("/register", (req, res) => {
  const { name, email, course } = req.body;

  res.send(page("Đăng ký thành công", `
    <h1>Đăng ký thành công</h1>
    <p>Cảm ơn <strong>${name}</strong> đã đăng ký khóa học <strong>${course}</strong>.</p>
    <p>Email xác nhận: ${email}</p>
    <a href="/">Về trang chủ</a>
  `));
});

app.get("/stats", (req, res) => {
  res.send(page("Thống kê", `
    <h1>Thống kê</h1>
    <p>Tổng số request: <strong>${requestCount}</strong></p>
  `));
});

app.use((req, res) => {
  res.status(404).send(page("404 - Không tìm thấy", `
    <h1>404 - Không tìm thấy trang</h1>
    <a href="/">Về trang chủ</a>
  `));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});