const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getAttendances,
    getMyAttendance,
} = require('../controllers/attendance.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

// Điểm danh
router.post('/check-in', verifyAuth, checkIn);
router.post('/check-out', verifyAuth, checkOut);

// Cá nhân xem lịch sử điểm danh của mình
router.get('/my-attendance', verifyAuth, getMyAttendance);

// HR / Admin xem toàn bộ danh sách điểm danh
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAttendances);

module.exports = router;
