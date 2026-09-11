const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper tìm employee theo user hiện tại (thông qua email)
async function getEmployeeForUser(user) {
    if (!user) return null;
    return await Employee.findOne({ email: user.email });
}

// Helper lấy đầu ngày theo múi giờ
function getStartOfDay(d = new Date()) {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getEndOfDay(d = new Date()) {
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return end;
}

const checkIn = async (req, res, next) => {
    try {
        let employeeId = req.body.employeeId;

        // Nếu là staff tự check-in, tìm qua email tài khoản
        if (!employeeId) {
            const emp = await getEmployeeForUser(req.user);
            if (!emp) {
                return res.status(400).json({
                    message: 'Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên nào (kiểm tra email trùng khớp).',
                });
            }
            employeeId = emp._id;
        }

        const now = new Date();
        const startOfDay = getStartOfDay(now);
        const endOfDay = getEndOfDay(now);

        // Kiểm tra xem hôm nay đã điểm danh vào chưa
        let record = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (record && record.checkIn) {
            return res.status(400).json({
                message: 'Nhân viên đã điểm danh vào ca hôm nay rồi.',
                data: record,
            });
        }

        // Quy định giờ chuẩn: 08:30 AM. Nếu sau 08:30 là đi muộn ('late')
        const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);
        const status = isLate ? 'late' : 'present';

        if (!record) {
            record = await Attendance.create({
                employeeId,
                date: startOfDay,
                checkIn: now,
                status,
            });
        } else {
            record.checkIn = now;
            record.status = status;
            await record.save();
        }

        const populated = await Attendance.findById(record._id).populate('employeeId', 'fullName employeeCode email');

        res.status(200).json({
            success: true,
            message: `Điểm danh vào ca thành công (${status === 'late' ? 'Đi muộn' : 'Đúng giờ'}).`,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

const checkOut = async (req, res, next) => {
    try {
        let employeeId = req.body.employeeId;

        if (!employeeId) {
            const emp = await getEmployeeForUser(req.user);
            if (!emp) {
                return res.status(400).json({
                    message: 'Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên.',
                });
            }
            employeeId = emp._id;
        }

        const now = new Date();
        const startOfDay = getStartOfDay(now);
        const endOfDay = getEndOfDay(now);

        const record = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({
                message: 'Chưa có bản ghi điểm danh vào ca hôm nay để có thể điểm danh ra.',
            });
        }

        if (record.checkOut) {
            return res.status(400).json({
                message: 'Hôm nay bạn đã điểm danh ra ca rồi.',
                data: record,
            });
        }

        record.checkOut = now;
        // Tính số giờ làm việc (giờ)
        const diffMs = record.checkOut - record.checkIn;
        record.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

        await record.save();

        const populated = await Attendance.findById(record._id).populate('employeeId', 'fullName employeeCode email');

        res.status(200).json({
            success: true,
            message: `Điểm danh ra ca thành công. Tổng thời gian làm việc: ${record.workingHours} giờ.`,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

const getAttendances = async (req, res, next) => {
    try {
        const { employeeId, date, month, year, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;

        if (date) {
            const d = new Date(date);
            query.date = { $gte: getStartOfDay(d), $lte: getEndOfDay(d) };
        } else if (month && year) {
            const startMonth = new Date(Number(year), Number(month) - 1, 1);
            const endMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            query.date = { $gte: startMonth, $lte: endMonth };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Attendance.countDocuments(query);
        const attendances = await Attendance.find(query)
            .populate({
                path: 'employeeId',
                select: 'fullName employeeCode email departmentId positionId',
                populate: [
                    { path: 'departmentId', select: 'name code' },
                    { path: 'positionId', select: 'name code' },
                ],
            })
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: attendances,
        });
    } catch (error) {
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const emp = await getEmployeeForUser(req.user);
        if (!emp) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân sự liên kết với tài khoản này.',
            });
        }

        const { month, year, page = 1, limit = 31 } = req.query;
        const query = { employeeId: emp._id };

        if (month && year) {
            const startMonth = new Date(Number(year), Number(month) - 1, 1);
            const endMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            query.date = { $gte: startMonth, $lte: endMonth };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Attendance.countDocuments(query);
        const attendances = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            employee: {
                id: emp._id,
                fullName: emp.fullName,
                employeeCode: emp.employeeCode,
            },
            total,
            data: attendances,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkIn,
    checkOut,
    getAttendances,
    getMyAttendance,
};
