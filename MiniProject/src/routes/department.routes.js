const express = require('express');
const router = express.Router();
const {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require('../controllers/department.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

router.get('/', verifyAuth, getAllDepartments);
router.get('/:id', verifyAuth, getDepartmentById);
router.post('/', verifyAuth, checkRole('admin', 'hr'), createDepartment);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updateDepartment);
router.delete('/:id', verifyAuth, checkRole('admin'), deleteDepartment);

module.exports = router;
