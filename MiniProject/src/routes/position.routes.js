const express = require('express');
const router = express.Router();
const {
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition,
} = require('../controllers/position.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

router.get('/', verifyAuth, getAllPositions);
router.get('/:id', verifyAuth, getPositionById);

router.post('/', verifyAuth, checkRole('admin', 'hr'), createPosition);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updatePosition);

router.delete('/:id', verifyAuth, checkRole('admin'), deletePosition);

module.exports = router;
