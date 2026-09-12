const express = require('express');
const router = express.Router();
const {
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition,
} = require('../controllers/position.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.get('/', verifyAuth, checkRole('admin', 'hr', 'staff'), getAllPositions);
router.get('/:id', verifyAuth, checkRole('admin', 'hr', 'staff'), getPositionById);
router.post('/', verifyAuth, checkRole('admin', 'hr'), createPosition);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updatePosition);
router.delete('/:id', verifyAuth, checkRole('admin'), deletePosition);

module.exports = router;
