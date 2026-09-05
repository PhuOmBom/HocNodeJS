const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRoles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/bookController');

const router = express.Router();
router.get('/', controller.listBooks);
router.get('/:id', controller.getBook);
router.use(authMiddleware);
router.post('/', requireRoles('seller', 'admin'), controller.createBook);
router.patch('/:id', requireRoles('seller', 'admin'), controller.updateBook);
router.delete('/:id', requireRoles('seller', 'admin'), controller.deleteBook);

module.exports = router;