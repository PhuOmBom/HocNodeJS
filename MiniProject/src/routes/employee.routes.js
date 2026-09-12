const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getBirthdays,
    getProbationEnding,
    exportEmployees,
} = require('../controllers/employee.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');

router.get('/birthdays', verifyAuth, checkRole('admin', 'hr'), getBirthdays);
router.get('/probation-ending', verifyAuth, checkRole('admin', 'hr'), getProbationEnding);
router.get('/export', verifyAuth, checkRole('admin', 'hr'), exportEmployees);

router.get('/', verifyAuth, checkRole('admin', 'hr', 'staff'), getAllEmployees);
router.get('/:id', verifyAuth, checkRole('admin', 'hr', 'staff'), getEmployeeById);
router.post('/', verifyAuth, checkRole('admin', 'hr'), createEmployee);
router.put('/:id', verifyAuth, checkRole('admin', 'hr'), updateEmployee);
router.delete('/:id', verifyAuth, checkRole('admin'), deleteEmployee);

module.exports = router;
