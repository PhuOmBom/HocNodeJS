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

// Public/Staff có thể xem danh sách phòng ban
router.get('/', verifyAuth, getAllDepartments);
router.get('/:id', verifyAuth, getDepartmentById);

// Admin và HR có quyền thêm/sửa
router.post('/', verifyAuth, checkRole('admin', 'hr'), createDepartment);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updateDepartment);

// Chỉ Admin có quyền xóa
router.delete('/:id', verifyAuth, checkRole('admin'), deleteDepartment);

module.exports = router;
