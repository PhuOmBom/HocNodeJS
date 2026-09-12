const express = require('express');
const router = express.Router();
const {
    getOverviewStats,
    getDepartmentStats,
    getPositionStats,
} = require('../controllers/statistic.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.get('/overview', verifyAuth, checkRole('admin', 'hr'), getOverviewStats);
router.get('/departments', verifyAuth, checkRole('admin', 'hr'), getDepartmentStats);
router.get('/positions', verifyAuth, checkRole('admin', 'hr'), getPositionStats);

module.exports = router;
