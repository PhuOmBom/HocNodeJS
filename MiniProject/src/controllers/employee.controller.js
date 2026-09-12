const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');
const { convertEmployeesToCsv } = require('../utils/exportCsv');

const getAllEmployees = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            keyword,
            search,
            departmentId,
            positionId,
            status,
            gender,
            sortBy = 'createdAt',
            order = 'desc',
        } = req.query;

        const query = {};

        if (departmentId) query.departmentId = departmentId;
        if (positionId) query.positionId = positionId;
        if (status) query.status = status;
        if (gender) query.gender = gender;

        const searchTerm = keyword || search;
        if (searchTerm) {
            query.$or = [
                { employeeCode: { $regex: searchTerm, $options: 'i' } },
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

        const sortOptions = {};
        const sortField = ['fullName', 'salary', 'startDate', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';
        sortOptions[sortField] = order === 'asc' ? 1 : -1;

        const totalItems = await Employee.countDocuments(query);
        const employees = await Employee.find(query)
            .populate('departmentId', 'name code')
            .populate('positionId', 'name code baseSalary')
            .populate('managerId', 'fullName employeeCode email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy danh sách nhân viên thành công',
            data: employees,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        res.status(200).json({
            message: 'Lấy thông tin nhân viên thành công',
            data: employee,
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
            avatarUrl,
            note,
        } = req.body;

        const errors = [];
        if (!employeeCode || !employeeCode.trim()) errors.push('Mã nhân viên không được để trống');
        if (!fullName || !fullName.trim()) errors.push('Họ và tên nhân viên không được để trống');
        if (!email || !email.trim()) errors.push('Email là bắt buộc');
        if (!phone || !phone.trim()) errors.push('Số điện thoại không được để trống');
        if (!gender || !['male', 'female', 'other'].includes(gender)) errors.push('Giới tính không hợp lệ (male, female, other)');
        if (!departmentId) errors.push('Phòng ban là bắt buộc');
        if (!positionId) errors.push('Chức vụ là bắt buộc');

        if (salary !== undefined && (isNaN(salary) || Number(salary) < 0)) {
            errors.push('Lương phải lớn hơn hoặc bằng 0');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors,
            });
        }

        const normalizedCode = employeeCode.toUpperCase().trim();
        const normalizedEmail = email.toLowerCase().trim();

        const [existCode, existEmail] = await Promise.all([
            Employee.findOne({ employeeCode: normalizedCode }),
            Employee.findOne({ email: normalizedEmail }),
        ]);

        if (existCode) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: [`Mã nhân viên "${normalizedCode}" đã tồn tại`],
            });
        }

        if (existEmail) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: [`Email "${normalizedEmail}" đã tồn tại`],
            });
        }

        const [department, position] = await Promise.all([
            Department.findById(departmentId),
            Position.findById(positionId),
        ]);

        if (!department) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Phòng ban không tồn tại'],
            });
        }

        if (!position) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Chức vụ không tồn tại'],
            });
        }

        if (managerId) {
            const manager = await Employee.findById(managerId);
            if (!manager) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: ['Người quản lý trực tiếp không tồn tại'],
                });
            }
        }

        const finalSalary = salary !== undefined ? Number(salary) : position.baseSalary;

        const employee = await Employee.create({
            employeeCode: normalizedCode,
            fullName: fullName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            address: address ? address.trim() : '',
            departmentId,
            positionId,
            managerId: managerId || null,
            salary: finalSalary,
            startDate: startDate ? new Date(startDate) : new Date(),
            status: status || 'probation',
            avatarUrl: avatarUrl || '',
            note: note || '',
        });

        res.status(201).json({
            message: 'Thêm nhân viên thành công',
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
                message: 'Không tìm thấy dữ liệu',
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
            avatarUrl,
            note,
        } = req.body;

        if (employeeCode) {
            const normalizedCode = employeeCode.toUpperCase().trim();
            if (normalizedCode !== employee.employeeCode) {
                const exist = await Employee.findOne({ employeeCode: normalizedCode, _id: { $ne: employee._id } });
                if (exist) {
                    return res.status(400).json({
                        message: 'Dữ liệu không hợp lệ',
                        errors: [`Mã nhân viên "${normalizedCode}" đã tồn tại`],
                    });
                }
                employee.employeeCode = normalizedCode;
            }
        }

        if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            if (normalizedEmail !== employee.email) {
                const exist = await Employee.findOne({ email: normalizedEmail, _id: { $ne: employee._id } });
                if (exist) {
                    return res.status(400).json({
                        message: 'Dữ liệu không hợp lệ',
                        errors: [`Email "${normalizedEmail}" đã tồn tại`],
                    });
                }
                employee.email = normalizedEmail;
            }
        }

        if (departmentId && departmentId !== String(employee.departmentId)) {
            const dept = await Department.findById(departmentId);
            if (!dept) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: ['Phòng ban không tồn tại'],
                });
            }
            employee.departmentId = departmentId;
        }

        if (positionId && positionId !== String(employee.positionId)) {
            const pos = await Position.findById(positionId);
            if (!pos) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: ['Chức vụ không tồn tại'],
                });
            }
            employee.positionId = positionId;
        }

        if (managerId !== undefined) {
            if (managerId && managerId !== String(employee._id)) {
                const mgr = await Employee.findById(managerId);
                if (!mgr) {
                    return res.status(400).json({
                        message: 'Dữ liệu không hợp lệ',
                        errors: ['Người quản lý không tồn tại'],
                    });
                }
                employee.managerId = managerId;
            } else {
                employee.managerId = null;
            }
        }

        if (fullName) employee.fullName = fullName.trim();
        if (phone) employee.phone = phone.trim();
        if (gender) employee.gender = gender;
        if (dateOfBirth) employee.dateOfBirth = new Date(dateOfBirth);
        if (address !== undefined) employee.address = address.trim();
        if (salary !== undefined) {
            if (isNaN(salary) || Number(salary) < 0) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: ['Lương phải lớn hơn hoặc bằng 0'],
                });
            }
            employee.salary = Number(salary);
        }
        if (startDate) employee.startDate = new Date(startDate);
        if (status) employee.status = status;
        if (avatarUrl !== undefined) employee.avatarUrl = avatarUrl;
        if (note !== undefined) employee.note = note;

        await employee.save();

        res.status(200).json({
            message: 'Cập nhật nhân viên thành công',
            data: employee,
        });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Xóa mềm: không xóa cứng, chỉ cập nhật status = 'resigned'
        employee.status = 'resigned';
        await employee.save();

        res.status(200).json({
            message: 'Xóa mềm nhân viên thành công',
            data: employee,
        });
    } catch (error) {
        next(error);
    }
};

// Bài 3: Lấy danh sách nhân viên có sinh nhật trong tháng
const getBirthdays = async (req, res, next) => {
    try {
        let targetMonth = parseInt(req.query.month, 10);
        if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
            targetMonth = new Date().getMonth() + 1; // Mặc định tháng hiện tại (1-12)
        }

        // Dùng aggregation để trích xuất $month từ dateOfBirth
        const employees = await Employee.aggregate([
            {
                $match: {
                    dateOfBirth: { $exists: true, $ne: null },
                    status: { $ne: 'resigned' },
                    $expr: {
                        $eq: [{ $month: '$dateOfBirth' }, targetMonth],
                    },
                },
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'departmentId',
                },
            },
            {
                $unwind: { path: '$departmentId', preserveNullAndEmptyArrays: true },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'positionId',
                    foreignField: '_id',
                    as: 'positionId',
                },
            },
            {
                $unwind: { path: '$positionId', preserveNullAndEmptyArrays: true },
            },
        ]);

        res.status(200).json({
            message: `Lấy danh sách nhân viên có sinh nhật trong tháng ${targetMonth} thành công`,
            data: employees,
        });
    } catch (error) {
        next(error);
    }
};

// Bài 3: Lấy nhân viên sắp hết thử việc
const getProbationEnding = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days, 10) || 7; // Mặc định 7 ngày

        // Giả sử thời gian thử việc là 60 ngày tính từ startDate
        // Ngày hết thử việc = startDate + 60 ngày
        // Điều kiện sắp hết thử việc: probationEnd >= now && probationEnd <= now + days
        // Tương đương: startDate >= now - 60 ngày + days ngày ???
        // Cụ thể: probationEnd = startDate + 60*24*60*60*1000
        // now <= startDate + 60 ngày <= now + days ngày
        // <=> now - 60 ngày <= startDate <= now + days - 60 ngày
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const probationDaysMs = 60 * 24 * 60 * 60 * 1000;
        const targetDaysMs = days * 24 * 60 * 60 * 1000;

        const minStartDate = new Date(now.getTime() - probationDaysMs);
        const maxStartDate = new Date(now.getTime() + targetDaysMs - probationDaysMs);

        const employees = await Employee.find({
            status: 'probation',
            startDate: { $gte: minStartDate, $lte: maxStartDate },
        })
            .populate('departmentId', 'name code')
            .populate('positionId', 'name code');

        res.status(200).json({
            message: `Lấy danh sách nhân viên sắp hết thử việc trong ${days} ngày tới thành công`,
            data: employees,
        });
    } catch (error) {
        next(error);
    }
};

// Bài 3: Xuất danh sách nhân viên dạng JSON hoặc CSV
const exportEmployees = async (req, res, next) => {
    try {
        const format = (req.query.format || 'json').toLowerCase();

        const employees = await Employee.find({ status: { $ne: 'resigned' } })
            .populate('departmentId', 'name code')
            .populate('positionId', 'name code')
            .sort({ employeeCode: 1 });

        if (format === 'csv') {
            const csvData = convertEmployeesToCsv(employees);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
            return res.status(200).send('\uFEFF' + csvData); // UTF-8 BOM for Excel compatibility
        }

        // Mặc định JSON (không xuất thông tin nhạy cảm)
        const safeData = employees.map((emp) => ({
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            department: emp.departmentId?.name || '',
            position: emp.positionId?.name || '',
            status: emp.status,
        }));

        res.status(200).json({
            message: 'Xuất danh sách nhân viên thành công',
            data: safeData,
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
    getBirthdays,
    getProbationEnding,
    exportEmployees,
};
