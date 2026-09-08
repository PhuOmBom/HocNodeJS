const express = require("express");
const {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

// Public routes: Ai cũng có thể xem danh sách và chi tiết sách (hỗ trợ filter ?category=...)
router.get("/", getBooks);
router.get("/:id", getBook);

// Protected & Authorized routes:
// Bài 1 & Bài 2: Chỉ user có role "admin" mới được thêm, sửa, xóa sách
router.post("/", authMiddleware, authorizeRoles("admin"), createBook);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateBook);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteBook);

module.exports = router;
