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

router.post('/', verifyAuth, createLeaveRequest);
router.get('/my-leaves', verifyAuth, getMyLeaveRequests);
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAllLeaveRequests);
router.patch('/:id/status', verifyAuth, checkRole('admin', 'hr'), updateLeaveStatus);
router.delete('/:id', verifyAuth, cancelLeaveRequest);

module.exports = router;
