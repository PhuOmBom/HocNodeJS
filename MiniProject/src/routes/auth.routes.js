const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyAuth, getMe);
router.put('/change-password', verifyAuth, changePassword);

module.exports = router;
