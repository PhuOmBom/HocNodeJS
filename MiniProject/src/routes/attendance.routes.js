const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getAttendances,
    getMyAttendance,
} = require('../controllers/attendance.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

router.post('/check-in', verifyAuth, checkIn);
router.post('/check-out', verifyAuth, checkOut);
router.get('/my-attendance', verifyAuth, getMyAttendance);
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAttendances);

module.exports = router;
