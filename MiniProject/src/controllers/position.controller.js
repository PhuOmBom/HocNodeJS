const Position = require('../models/Position');
const Employee = require('../models/Employee');

const getAllPositions = async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Position.countDocuments(query);
        const positions = await Position.find(query)
            .sort({ baseSalary: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: positions,
        });
    } catch (error) {
        next(error);
    }
};

const getPositionById = async (req, res, next) => {
    try {
        const position = await Position.findById(req.params.id);
        if (!position) {
            return res.status(404).json({
                message: 'Không tìm thấy chức vụ.',
            });
        }

        const employees = await Employee.find({ positionId: position._id })
            .populate('departmentId', 'name code')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                ...position.toObject(),
                employees,
                totalEmployees: employees.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

const createPosition = async (req, res, next) => {
    try {
        const { name, code, description, baseSalary, status } = req.body;

        if (!name || !code || baseSalary === undefined) {
            return res.status(400).json({
                message: 'Tên chức vụ, mã chức vụ và mức lương cơ bản là bắt buộc.',
            });
        }

        if (Number(baseSalary) < 0) {
            return res.status(400).json({
                message: 'Lương cơ bản không được âm.',
            });
        }

        const normalizedCode = code.toUpperCase().trim();
        const existing = await Position.findOne({ code: normalizedCode });
        if (existing) {
            return res.status(400).json({
                message: `Mã chức vụ "${normalizedCode}" đã tồn tại.`,
            });
        }

        const position = await Position.create({
            name: name.trim(),
            code: normalizedCode,
            description: description?.trim() || '',
            baseSalary: Number(baseSalary),
            status: status || 'active',
        });

        res.status(201).json({
            success: true,
            message: 'Tạo chức vụ thành công.',
            data: position,
        });
    } catch (error) {
        next(error);
    }
};

const updatePosition = async (req, res, next) => {
    try {
        const { name, code, description, baseSalary, status } = req.body;
        const position = await Position.findById(req.params.id);

        if (!position) {
            return res.status(404).json({
                message: 'Không tìm thấy chức vụ.',
            });
        }

        if (code) {
            const normalizedCode = code.toUpperCase().trim();
            if (normalizedCode !== position.code) {
                const existing = await Position.findOne({ code: normalizedCode, _id: { $ne: position._id } });
                if (existing) {
                    return res.status(400).json({
                        message: `Mã chức vụ "${normalizedCode}" đã được sử dụng.`,
                    });
                }
                position.code = normalizedCode;
            }
        }

        if (name) position.name = name.trim();
        if (description !== undefined) position.description = description.trim();
        if (baseSalary !== undefined) {
            if (Number(baseSalary) < 0) {
                return res.status(400).json({ message: 'Lương cơ bản không được âm.' });
            }
            position.baseSalary = Number(baseSalary);
        }
        if (status) position.status = status;

        await position.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật chức vụ thành công.',
            data: position,
        });
    } catch (error) {
        next(error);
    }
};

const deletePosition = async (req, res, next) => {
    try {
        const position = await Position.findById(req.params.id);
        if (!position) {
            return res.status(404).json({
                message: 'Không tìm thấy chức vụ.',
            });
        }

        const activeEmployees = await Employee.countDocuments({
            positionId: position._id,
            status: { $in: ['active', 'probation'] },
        });

        if (activeEmployees > 0) {
            return res.status(400).json({
                message: `Không thể xóa chức vụ này vì có ${activeEmployees} nhân sự đang nắm giữ. Vui lòng chuyển đổi chức vụ cho nhân sự trước.`,
            });
        }

        await Position.findByIdAndDelete(position._id);

        res.status(200).json({
            success: true,
            message: 'Đã xóa chức vụ thành công.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition,
};
