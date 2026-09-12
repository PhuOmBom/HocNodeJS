const express = require('express');
const router = express.Router();
const {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require('../controllers/department.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.get('/', verifyAuth, checkRole('admin', 'hr', 'staff'), getAllDepartments);
router.get('/:id', verifyAuth, checkRole('admin', 'hr', 'staff'), getDepartmentById);
router.post('/', verifyAuth, checkRole('admin', 'hr'), createDepartment);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updateDepartment);
router.delete('/:id', verifyAuth, checkRole('admin'), deleteDepartment);

module.exports = router;
