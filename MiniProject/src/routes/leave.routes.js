const express = require('express');
const router = express.Router();
const {
    createLeaveRequest,
    getAllLeaveRequests,
    getMyLeaveRequests,
    updateLeaveStatus,
    cancelLeaveRequest,
} = require('../controllers/leave.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

// Nộp đơn xin nghỉ
router.post('/', verifyAuth, createLeaveRequest);

// Cá nhân xem các đơn xin nghỉ của mình
router.get('/my-leaves', verifyAuth, getMyLeaveRequests);

// HR / Admin xem tất cả các đơn xin nghỉ
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAllLeaveRequests);

// HR / Admin phê duyệt hoặc từ chối
router.patch('/:id/status', verifyAuth, checkRole('admin', 'hr'), updateLeaveStatus);

// Nhân viên tự hủy đơn pending
router.delete('/:id', verifyAuth, cancelLeaveRequest);

module.exports = router;
