const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
} = require('../controllers/profile.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.get('/', verifyAuth, checkRole('admin', 'hr', 'staff'), getProfile);
router.put('/', verifyAuth, checkRole('admin', 'hr', 'staff'), updateProfile);
router.patch('/change-password', verifyAuth, checkRole('admin', 'hr', 'staff'), changePassword);

module.exports = router;
