const express = require('express');
const router = express.Router();
const {
    createLeave,
    getAllLeaves,
    getMyLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
} = require('../controllers/leave.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.post('/', verifyAuth, checkRole('admin', 'hr', 'staff'), createLeave);
router.get('/me', verifyAuth, checkRole('admin', 'hr', 'staff'), getMyLeaves);
router.get('/', verifyAuth, checkRole('admin', 'hr'), getAllLeaves);

router.get('/:id', verifyAuth, checkRole('admin', 'hr', 'staff'), getLeaveById);
router.patch('/:id/approve', verifyAuth, checkRole('admin', 'hr'), approveLeave);
router.patch('/:id/reject', verifyAuth, checkRole('admin', 'hr'), rejectLeave);

module.exports = router;
