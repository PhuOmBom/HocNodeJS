const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const getAllEmployees = async (req, res, next) => {
    try {
        const {
            search,
            departmentId,
            positionId,
            status,
            gender,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 20,
        } = req.query;

        const query = {};

        if (departmentId) query.departmentId = departmentId;
        if (positionId) query.positionId = positionId;
        if (status) query.status = status;
        if (gender) query.gender = gender;

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeCode: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const total = await Employee.countDocuments(query);
        const employees = await Employee.find(query)
            .populate('departmentId', 'name code')
            .populate('positionId', 'name code baseSalary')
            .populate('managerId', 'fullName employeeCode email')
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: employees,
        });
    } catch (error) {
        next(error);
    }
};

const getEmployeeById = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('departmentId', 'name code description')
            .populate('positionId', 'name code baseSalary')
            .populate('managerId', 'fullName employeeCode email phone');

        if (!employee) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân sự.',
            });
        }

        const [recentAttendances, recentLeaves] = await Promise.all([
            Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(7),
            Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(5),
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...employee.toObject(),
                recentAttendances,
                recentLeaves,
            },
        });
    } catch (error) {
        next(error);
    }
};

const createEmployee = async (req, res, next) => {
    try {
        let {
            employeeCode,
            fullName,
            email,
            phone,
            gender,
            dateOfBirth,
            address,
            departmentId,
            positionId,
            managerId,
            salary,
            startDate,
            status,
        } = req.body;

        if (!fullName || !email || !phone || !gender || !dateOfBirth || !address || !departmentId || !positionId) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ các trường thông tin bắt buộc.',
            });
        }

        const [dept, pos] = await Promise.all([
            Department.findById(departmentId),
            Position.findById(positionId),
        ]);

        if (!dept) return res.status(400).json({ message: 'Phòng ban không tồn tại.' });
        if (!pos) return res.status(400).json({ message: 'Chức vụ không tồn tại.' });

        if (managerId) {
            const mgr = await Employee.findById(managerId);
            if (!mgr) return res.status(400).json({ message: 'Quản lý trực tiếp không tồn tại.' });
        }

        if (!employeeCode) {
            const count = await Employee.countDocuments();
            employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;
        } else {
            employeeCode = employeeCode.toUpperCase().trim();
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedPhone = phone.trim();

        const [existCode, existEmail, existPhone] = await Promise.all([
            Employee.findOne({ employeeCode }),
            Employee.findOne({ email: normalizedEmail }),
            Employee.findOne({ phone: trimmedPhone }),
        ]);

        if (existCode) return res.status(400).json({ message: `Mã nhân viên "${employeeCode}" đã tồn tại.` });
        if (existEmail) return res.status(400).json({ message: `Email "${normalizedEmail}" đã được sử dụng.` });
        if (existPhone) return res.status(400).json({ message: `Số điện thoại "${trimmedPhone}" đã được sử dụng.` });

        const finalSalary = salary !== undefined ? Number(salary) : pos.baseSalary;

        const employee = await Employee.create({
            employeeCode,
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: trimmedPhone,
            gender,
            dateOfBirth,
            address: address.trim(),
            departmentId,
            positionId,
            managerId: managerId || null,
            salary: finalSalary,
            startDate: startDate || new Date(),
            status: status || 'probation',
        });

        res.status(201).json({
            success: true,
            message: 'Thêm nhân viên mới thành công.',
            data: employee,
        });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân sự.',
            });
        }

        const {
            employeeCode,
            fullName,
            email,
            phone,
            gender,
            dateOfBirth,
            address,
            departmentId,
            positionId,
            managerId,
            salary,
            startDate,
            status,
        } = req.body;

        if (employeeCode) {
            const normalizedCode = employeeCode.toUpperCase().trim();
            if (normalizedCode !== employee.employeeCode) {
                const existCode = await Employee.findOne({ employeeCode: normalizedCode, _id: { $ne: employee._id } });
                if (existCode) return res.status(400).json({ message: `Mã nhân viên "${normalizedCode}" đã được dùng.` });
                employee.employeeCode = normalizedCode;
            }
        }

        if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== employee.email) {
                const existEmail = await Employee.findOne({ email: normalizedEmail, _id: { $ne: employee._id } });
                if (existEmail) return res.status(400).json({ message: `Email "${normalizedEmail}" đã được dùng.` });
                employee.email = normalizedEmail;
            }
        }

        if (phone) {
            const trimmedPhone = phone.trim();
            if (trimmedPhone !== employee.phone) {
                const existPhone = await Employee.findOne({ phone: trimmedPhone, _id: { $ne: employee._id } });
                if (existPhone) return res.status(400).json({ message: `Số điện thoại "${trimmedPhone}" đã được dùng.` });
                employee.phone = trimmedPhone;
            }
        }

        if (departmentId && departmentId !== String(employee.departmentId)) {
            const dept = await Department.findById(departmentId);
            if (!dept) return res.status(400).json({ message: 'Phòng ban không tồn tại.' });
            employee.departmentId = departmentId;
        }

        if (positionId && positionId !== String(employee.positionId)) {
            const pos = await Position.findById(positionId);
            if (!pos) return res.status(400).json({ message: 'Chức vụ không tồn tại.' });
            employee.positionId = positionId;
        }

        if (managerId !== undefined) {
            if (managerId && managerId !== String(employee._id)) {
                const mgr = await Employee.findById(managerId);
                if (!mgr) return res.status(400).json({ message: 'Quản lý trực tiếp không tồn tại.' });
                employee.managerId = managerId;
            } else {
                employee.managerId = null;
            }
        }

        if (fullName) employee.fullName = fullName.trim();
        if (gender) employee.gender = gender;
        if (dateOfBirth) employee.dateOfBirth = dateOfBirth;
        if (address) employee.address = address.trim();
        if (salary !== undefined) employee.salary = Number(salary);
        if (startDate) employee.startDate = startDate;
        if (status) employee.status = status;

        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin nhân viên thành công.',
            data: employee,
        });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const { hardDelete = false } = req.query;
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân sự.',
            });
        }

        if (hardDelete === 'true') {
            await Promise.all([
                Employee.findByIdAndDelete(employee._id),
                Attendance.deleteMany({ employeeId: employee._id }),
                Leave.deleteMany({ employeeId: employee._id }),
            ]);
            return res.status(200).json({
                success: true,
                message: 'Đã xóa vĩnh viễn hồ sơ và dữ liệu liên quan của nhân sự.',
            });
        }

        employee.status = 'resigned';
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật trạng thái nhân viên sang "Đã nghỉ việc" (resigned).',
            data: employee,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
};
