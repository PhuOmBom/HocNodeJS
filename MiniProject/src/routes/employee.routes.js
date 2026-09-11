const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} = require('../controllers/employee.controller');
const { verifyAuth, checkRole } = require('../middlewares/auth.middleware');

router.get('/', verifyAuth, getAllEmployees);
router.get('/:id', verifyAuth, getEmployeeById);

router.post('/', verifyAuth, checkRole('admin', 'hr'), createEmployee);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updateEmployee);

router.delete('/:id', verifyAuth, checkRole('admin'), deleteEmployee);

module.exports = router;
