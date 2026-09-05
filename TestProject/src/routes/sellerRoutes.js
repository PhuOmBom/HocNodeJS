const express = require('express');
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/sellerController');
const router = express.Router();
router.post('/request', auth, roles('customer', 'user'), controller.submit);
router.get('/requests', auth, roles('admin'), controller.list);
router.patch('/requests/:id/review', auth, roles('admin'), controller.review);
module.exports = router;