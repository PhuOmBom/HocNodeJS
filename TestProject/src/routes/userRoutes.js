const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/authController');

const router = express.Router();
router.use(authMiddleware);
router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);

module.exports = router;