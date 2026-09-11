const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

async function getEmployeeForUser(user) {
    if (!user) return null;
    return await Employee.findOne({ email: user.email });
}

const createLeaveRequest = async (req, res, next) => {
    try {
        let { employeeId, leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message: 'Loại nghỉ phép, ngày bắt đầu, ngày kết thúc và lý do là bắt buộc.',
            });
        }

        if (!employeeId) {
            const emp = await getEmployeeForUser(req.user);
            if (!emp) {
                return res.status(400).json({
                    message: 'Tài khoản của bạn chưa được liên kết với hồ sơ nhân sự.',
                });
            }
            employeeId = emp._id;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Định dạng ngày tháng không hợp lệ.' });
        }

        if (start > end) {
            return res.status(400).json({ message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' });
        }

        const leave = await Leave.create({
            employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            reason: reason.trim(),
            status: 'pending',
        });

        const populated = await Leave.findById(leave._id).populate('employeeId', 'fullName employeeCode email departmentId');

        res.status(201).json({
            success: true,
            message: 'Nộp đơn xin nghỉ phép thành công. Đang chờ phê duyệt.',
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

const getAllLeaveRequests = async (req, res, next) => {
    try {
        const { status, leaveType, employeeId, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;
        if (employeeId) query.employeeId = employeeId;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .populate({
                path: 'employeeId',
                select: 'fullName employeeCode email departmentId positionId',
                populate: [
                    { path: 'departmentId', select: 'name code' },
                    { path: 'positionId', select: 'name code' },
                ],
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: leaves,
        });
    } catch (error) {
        next(error);
    }
};

const getMyLeaveRequests = async (req, res, next) => {
    try {
        const emp = await getEmployeeForUser(req.user);
        if (!emp) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân sự liên kết với tài khoản này.',
            });
        }

        const { status, page = 1, limit = 20 } = req.query;
        const query = { employeeId: emp._id };
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            total,
            data: leaves,
        });
    } catch (error) {
        next(error);
    }
};

const updateLeaveStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Trạng thái xét duyệt phải là "approved" (Duyệt) hoặc "rejected" (Từ chối).',
            });
        }

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn xin nghỉ phép.',
            });
        }

        leave.status = status;
        await leave.save();

        // Nếu duyệt nghỉ, tạo điểm danh trạng thái 'leave' cho các ngày nghỉ
        if (status === 'approved') {
            const cur = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            cur.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            while (cur <= end) {
                // Không điểm danh vào Chủ nhật (0)
                if (cur.getDay() !== 0) {
                    await Attendance.findOneAndUpdate(
                        { employeeId: leave.employeeId, date: new Date(cur) },
                        { employeeId: leave.employeeId, date: new Date(cur), status: 'leave' },
                        { upsert: true }
                    );
                }
                cur.setDate(cur.getDate() + 1);
            }
        }

        const populated = await Leave.findById(leave._id).populate('employeeId', 'fullName employeeCode email');

        res.status(200).json({
            success: true,
            message: `Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} đơn xin nghỉ phép.`,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

const cancelLeaveRequest = async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({
                message: 'Không tìm thấy đơn xin nghỉ phép.',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                message: 'Chỉ có thể hủy đơn xin nghỉ khi đơn còn ở trạng thái "pending" (chờ duyệt).',
            });
        }

        await Leave.findByIdAndDelete(leave._id);

        res.status(200).json({
            success: true,
            message: 'Đã hủy đơn xin nghỉ phép thành công.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLeaveRequest,
    getAllLeaveRequests,
    getMyLeaveRequests,
    updateLeaveStatus,
    cancelLeaveRequest,
};
