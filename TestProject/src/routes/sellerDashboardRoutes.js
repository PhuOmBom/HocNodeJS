const express = require('express');
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/adminController');
const router = express.Router();
router.get('/', auth, roles('seller'), controller.sellerDashboard);
module.exports = router;