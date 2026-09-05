const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/authController');

const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', authMiddleware, controller.logout);
router.get('/profile', authMiddleware, controller.getProfile);
router.patch('/profile', authMiddleware, controller.updateProfile);

module.exports = router;