/**
 * Bài tập nhỏ 4: Demo tạo và kiểm tra JSON Web Token (JWT)
 */
require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// 1. Tạo payload gồm userId, email, role
const payload = {
  userId: "66b1f0b8e3c9a7d1a1234567",
  email: "student@example.com",
  role: "admin",
};

console.log("=== BÀI TẬP NHỎ 4: DEMO JWT ===");
console.log("1. Original Payload:", payload);

// 2. Tạo token bằng jwt.sign()
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN,
});

// 3. In token ra terminal
console.log("\n2. Generated JWT Token:\n", token);

// 4. Verify token bằng jwt.verify()
try {
  const decoded = jwt.verify(token, JWT_SECRET);

  // 5. In payload sau khi verify
  console.log("\n3. Decoded Payload sau khi verify thành công:");
  console.log(decoded);
} catch (error) {
  console.error("\nLỗi verify token:", error.message);
}
