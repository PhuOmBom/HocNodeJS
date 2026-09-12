const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

async function resolveEmployeeId(req) {
    if (req.body.employeeId && (req.user.role === 'admin' || req.user.role === 'hr')) {
        return req.body.employeeId;
    }
    const emp = await Employee.findOne({ email: req.user.email });
    return emp ? emp._id : null;
}

function getDayRange(d = new Date()) {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

const checkIn = async (req, res, next) => {
    try {
        let employeeId = req.body.employeeId;
        if (!employeeId) {
            employeeId = await resolveEmployeeId(req);
        }

        if (!employeeId) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không tìm thấy thông tin hồ sơ nhân viên để thực hiện check-in'],
            });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Nhân viên không tồn tại trong hệ thống'],
            });
        }

        const now = new Date();
        const { start, end } = getDayRange(now);

        const existingRecord = await Attendance.findOne({
            employeeId,
            date: { $gte: start, $lte: end },
        });

        if (existingRecord && existingRecord.checkIn) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Một nhân viên chỉ được check-in một lần trong một ngày'],
            });
        }

        // Quy định giờ muộn (ví dụ sau 8h30 là late)
        const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);
        const status = isLate ? 'late' : 'present';

        let record;
        if (!existingRecord) {
            record = await Attendance.create({
                employeeId,
                date: start,
                checkIn: now,
                status,
            });
        } else {
            existingRecord.checkIn = now;
            existingRecord.status = status;
            await existingRecord.save();
            record = existingRecord;
        }

        res.status(200).json({
            message: 'Check-in thành công',
            data: record,
        });
    } catch (error) {
        next(error);
    }
};

const checkOut = async (req, res, next) => {
    try {
        let employeeId = req.body.employeeId;
        if (!employeeId) {
            employeeId = await resolveEmployeeId(req);
        }

        if (!employeeId) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không tìm thấy thông tin hồ sơ nhân viên để thực hiện check-out'],
            });
        }

        const now = new Date();
        const { start, end } = getDayRange(now);

        const record = await Attendance.findOne({
            employeeId,
            date: { $gte: start, $lte: end },
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không được check-out nếu chưa check-in'],
            });
        }

        if (record.checkOut) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không được check-out nhiều lần trong cùng một ngày'],
            });
        }

        record.checkOut = now;
        const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        record.workingHours = diffHours;

        await record.save();

        res.status(200).json({
            message: 'Check-out thành công',
            data: record,
        });
    } catch (error) {
        next(error);
    }
};

const getAllAttendances = async (req, res, next) => {
    try {
        const { employeeId, fromDate, toDate, status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) {
                const f = new Date(fromDate);
                f.setHours(0, 0, 0, 0);
                query.date.$gte = f;
            }
            if (toDate) {
                const t = new Date(toDate);
                t.setHours(23, 59, 59, 999);
                query.date.$lte = t;
            }
        }

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
        const totalItems = await Attendance.countDocuments(query);
        const attendances = await Attendance.find(query)
            .populate('employeeId', 'fullName employeeCode email departmentId positionId')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy danh sách chấm công thành công',
            data: attendances,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
        });
    } catch (error) {
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const emp = await Employee.findOne({ email: req.user.email });
        if (!emp) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân viên liên kết với tài khoản này',
            });
        }

        const { fromDate, toDate, page = 1, limit = 10 } = req.query;
        const query = { employeeId: emp._id };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) {
                const f = new Date(fromDate);
                f.setHours(0, 0, 0, 0);
                query.date.$gte = f;
            }
            if (toDate) {
                const t = new Date(toDate);
                t.setHours(23, 59, 59, 999);
                query.date.$lte = t;
            }
        }

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
        const totalItems = await Attendance.countDocuments(query);
        const attendances = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy thông tin chấm công của bản thân thành công',
            data: attendances,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
        });
    } catch (error) {
        next(error);
    }
};

const getAttendanceByEmployee = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu nhân viên',
            });
        }

        const { fromDate, toDate, page = 1, limit = 10 } = req.query;
        const query = { employeeId: employee._id };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) {
                const f = new Date(fromDate);
                f.setHours(0, 0, 0, 0);
                query.date.$gte = f;
            }
            if (toDate) {
                const t = new Date(toDate);
                t.setHours(23, 59, 59, 999);
                query.date.$lte = t;
            }
        }

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
        const totalItems = await Attendance.countDocuments(query);
        const attendances = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy thông tin chấm công của nhân viên thành công',
            data: attendances,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkIn,
    checkOut,
    getAllAttendances,
    getMyAttendance,
    getAttendanceByEmployee,
};
