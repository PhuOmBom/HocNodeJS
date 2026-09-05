const express = require('express');
const auth = require('../middlewares/authMiddleware');
const controller = require('../controllers/cartController');
const router = express.Router();
router.use(auth);
router.get('/', controller.get);
router.post('/items', controller.add);
router.patch('/items/:bookId', controller.update);
module.exports = router;