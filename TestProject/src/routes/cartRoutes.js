const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items', cartController.updateItem);
router.patch('/items/:bookId', cartController.updateItem);
router.delete('/items/:bookId', cartController.removeItem);

module.exports = router;