const Department = require('../models/Department');
const Employee = require('../models/Employee');

const getAllDepartments = async (req, res, next) => {
    try {
        const { status, search } = req.query;
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

        const departments = await Department.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách phòng ban thành công',
            data: departments,
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        res.status(200).json({
            message: 'Lấy thông tin phòng ban thành công',
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

const createDepartment = async (req, res, next) => {
    try {
        const { name, code, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Tên phòng ban không được để trống'],
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Mã phòng ban không được để trống'],
            });
        }

        const normalizedCode = code.toUpperCase().trim();
        const existingDept = await Department.findOne({ code: normalizedCode });
        if (existingDept) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: [`Mã phòng ban "${normalizedCode}" đã tồn tại`],
            });
        }

        const department = await Department.create({
            name: name.trim(),
            code: normalizedCode,
            description: description?.trim() || '',
            status: status || 'active',
        });

        res.status(201).json({
            message: 'Thêm phòng ban thành công',
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        if (code) {
            const normalizedCode = code.toUpperCase().trim();
            if (normalizedCode !== department.code) {
                const existing = await Department.findOne({ code: normalizedCode, _id: { $ne: department._id } });
                if (existing) {
                    return res.status(400).json({
                        message: 'Dữ liệu không hợp lệ',
                        errors: [`Mã phòng ban "${normalizedCode}" đã được sử dụng`],
                    });
                }
                department.code = normalizedCode;
            }
        }

        if (name !== undefined) department.name = name.trim();
        if (description !== undefined) department.description = description.trim();
        if (status !== undefined) department.status = status;

        await department.save();

        res.status(200).json({
            message: 'Cập nhật phòng ban thành công',
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Nghiệp vụ: Không cho xóa phòng ban nếu vẫn còn nhân viên active
        const activeEmployees = await Employee.countDocuments({
            departmentId: department._id,
            status: { $in: ['active', 'probation'] },
        });

        if (activeEmployees > 0) {
            return res.status(400).json({
                message: `Không thể xóa phòng ban vì vẫn còn ${activeEmployees} nhân viên đang làm việc`,
            });
        }

        // Xóa mềm: cập nhật status thành inactive
        department.status = 'inactive';
        await department.save();

        res.status(200).json({
            message: 'Xóa mềm phòng ban thành công',
            data: department,
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
