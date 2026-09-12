const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getAllAttendances,
    getMyAttendance,
    getAttendanceByEmployee,
} = require('../controllers/attendance.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.post('/check-in', verifyAuth, checkRole('admin', 'hr', 'staff'), checkIn);
router.post('/check-out', verifyAuth, checkRole('admin', 'hr', 'staff'), checkOut);
router.get('/me', verifyAuth, checkRole('admin', 'hr', 'staff'), getMyAttendance);
router.get('/employee/:employeeId', verifyAuth, checkRole('admin', 'hr'), getAttendanceByEmployee);
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAllAttendances);

module.exports = router;
