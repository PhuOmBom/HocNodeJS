require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Book = require("./src/models/Book");

async function seedData() {
  try {
    await connectDB();
    console.log("Seeding initial database...");

    // 1. Dọn dẹp dữ liệu cũ (tùy chọn)
    await User.deleteMany({});
    await Book.deleteMany({});

    // 2. Tạo tài khoản mẫu
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const hashedUserPassword = await bcrypt.hash("user123", 10);

    const admin = await User.create({
      name: "Quản trị viên (Admin)",
      email: "admin@gmail.com",
      password: hashedAdminPassword,
      role: "admin",
    });

    const user = await User.create({
      name: "Người dùng mẫu (User)",
      email: "user@gmail.com",
      password: hashedUserPassword,
      role: "user",
    });

    console.log("-> Đã tạo 2 tài khoản mẫu:");
    console.log("   - Admin: admin@gmail.com / admin123 (role: admin)");
    console.log("   - User : user@gmail.com / user123 (role: user)");

    // 3. Tạo sách mẫu
    const books = await Book.create([
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Programming",
        available: true,
        createdBy: admin._id,
      },
      {
        title: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        category: "Programming",
        available: true,
        createdBy: admin._id,
      },
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        category: "Database",
        available: true,
        createdBy: admin._id,
      },
      {
        title: "Don't Make Me Think",
        author: "Steve Krug",
        category: "Design",
        available: false,
        createdBy: admin._id,
      },
    ]);

    console.log(`-> Đã tạo ${books.length} cuốn sách mẫu.`);
    console.log("Seeding hoàn tất thành công!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error.message);
    process.exit(1);
  }
}

seedData();
