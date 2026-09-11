const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

router.get('/stats', verifyAuth, checkRole('admin', 'hr'), getDashboardStats);

module.exports = router;
