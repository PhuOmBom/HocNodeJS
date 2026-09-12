const Department = require('../models/Department');
const Employee = require('../models/Employee');

const getAllDepartments = async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Department.countDocuments(query);
        const departments = await Department.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const deptIds = departments.map((d) => d._id);
        const employeeCounts = await Employee.aggregate([
            { $match: { departmentId: { $in: deptIds }, status: { $ne: 'resigned' } } },
            { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        employeeCounts.forEach((c) => {
            countMap[c._id.toString()] = c.count;
        });

        const dataWithCounts = departments.map((d) => ({
            ...d.toObject(),
            totalEmployees: countMap[d._id.toString()] || 0,
        }));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: dataWithCounts,
        });
    } catch (error) {
        next(error);
    }
};

const getDepartmentById = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                message: 'Không tìm thấy phòng ban.',
            });
        }

        const employees = await Employee.find({ departmentId: department._id })
            .populate('positionId', 'name code baseSalary')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                ...department.toObject(),
                employees,
                totalEmployees: employees.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

const createDepartment = async (req, res, next) => {
    try {
        const { name, code, description, status } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                message: 'Tên phòng ban và mã phòng ban là bắt buộc.',
            });
        }

        const normalizedCode = code.toUpperCase().trim();
        const existingDept = await Department.findOne({ code: normalizedCode });
        if (existingDept) {
            return res.status(400).json({
                message: `Mã phòng ban "${normalizedCode}" đã tồn tại.`,
            });
        }

        const department = await Department.create({
            name: name.trim(),
            code: normalizedCode,
            description: description?.trim() || '',
            status: status || 'active',
        });

        res.status(201).json({
            success: true,
            message: 'Tạo phòng ban thành công.',
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const { name, code, description, status } = req.body;
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: 'Không tìm thấy phòng ban.',
            });
        }

        if (code) {
            const normalizedCode = code.toUpperCase().trim();
            if (normalizedCode !== department.code) {
                const existing = await Department.findOne({ code: normalizedCode, _id: { $ne: department._id } });
                if (existing) {
                    return res.status(400).json({
                        message: `Mã phòng ban "${normalizedCode}" đã được sử dụng.`,
                    });
                }
                department.code = normalizedCode;
            }
        }

        if (name) department.name = name.trim();
        if (description !== undefined) department.description = description.trim();
        if (status) department.status = status;

        await department.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật phòng ban thành công.',
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                message: 'Không tìm thấy phòng ban.',
            });
        }

        const activeEmployeeCount = await Employee.countDocuments({
            departmentId: department._id,
            status: { $in: ['active', 'probation'] },
        });

        if (activeEmployeeCount > 0) {
            return res.status(400).json({
                message: `Không thể xóa phòng ban này vì đang có ${activeEmployeeCount} nhân sự đang làm việc. Vui lòng chuyển công tác nhân sự trước hoặc chuyển trạng thái sang "inactive".`,
            });
        }

        await Department.findByIdAndDelete(department._id);

        res.status(200).json({
            success: true,
            message: 'Đã xóa phòng ban thành công.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
