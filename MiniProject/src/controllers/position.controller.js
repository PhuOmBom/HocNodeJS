const Position = require('../models/Position');
const Employee = require('../models/Employee');

const getAllPositions = async (req, res, next) => {
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

        const positions = await Position.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách chức vụ thành công',
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        res.status(200).json({
            message: 'Lấy thông tin chức vụ thành công',
            data: position,
        });
    } catch (error) {
        next(error);
    }
};

const createPosition = async (req, res, next) => {
    try {
        const { name, code, description, baseSalary, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Tên chức vụ không được để trống'],
            });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Mã chức vụ không được để trống'],
            });
        }

        if (baseSalary === undefined || baseSalary === null || isNaN(baseSalary) || Number(baseSalary) < 0) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Lương phải lớn hơn hoặc bằng 0'],
            });
        }

        const normalizedCode = code.toUpperCase().trim();
        const existingPos = await Position.findOne({ code: normalizedCode });
        if (existingPos) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: [`Mã chức vụ "${normalizedCode}" đã tồn tại`],
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
            message: 'Thêm chức vụ thành công',
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        if (code) {
            const normalizedCode = code.toUpperCase().trim();
            if (normalizedCode !== position.code) {
                const existing = await Position.findOne({ code: normalizedCode, _id: { $ne: position._id } });
                if (existing) {
                    return res.status(400).json({
                        message: 'Dữ liệu không hợp lệ',
                        errors: [`Mã chức vụ "${normalizedCode}" đã được sử dụng`],
                    });
                }
                position.code = normalizedCode;
            }
        }

        if (name !== undefined) position.name = name.trim();
        if (description !== undefined) position.description = description.trim();
        if (baseSalary !== undefined) {
            if (isNaN(baseSalary) || Number(baseSalary) < 0) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: ['Lương phải lớn hơn hoặc bằng 0'],
                });
            }
            position.baseSalary = Number(baseSalary);
        }
        if (status !== undefined) position.status = status;

        await position.save();

        res.status(200).json({
            message: 'Cập nhật chức vụ thành công',
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
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Nghiệp vụ: Không cho xóa chức vụ nếu vẫn còn nhân viên đang sử dụng
        const activeEmployees = await Employee.countDocuments({
            positionId: position._id,
            status: { $in: ['active', 'probation'] },
        });

        if (activeEmployees > 0) {
            return res.status(400).json({
                message: `Không thể xóa chức vụ vì vẫn còn ${activeEmployees} nhân viên đang sử dụng`,
            });
        }

        // Xóa mềm: cập nhật status thành inactive
        position.status = 'inactive';
        await position.save();

        res.status(200).json({
            message: 'Xóa mềm chức vụ thành công',
            data: position,
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
