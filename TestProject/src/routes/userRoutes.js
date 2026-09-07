const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/authController');

const router = express.Router();
router.use(authMiddleware);
router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.get('/addresses', controller.getAddresses);
router.post('/addresses', controller.addAddress);
router.patch('/addresses/:id/default', controller.setDefaultAddress);
router.put('/addresses/:id', controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);

module.exports = router;