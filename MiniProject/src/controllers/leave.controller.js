const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// Gửi đơn nghỉ phép
const createLeave = async (req, res, next) => {
    try {
        let { employeeId, leaveType, startDate, endDate, reason } = req.body;

        const errors = [];
        if (!leaveType) errors.push('Loại nghỉ phép là bắt buộc (annual, sick, unpaid)');
        if (!startDate) errors.push('Ngày bắt đầu là bắt buộc');
        if (!endDate) errors.push('Ngày kết thúc là bắt buộc');
        if (!reason || !reason.trim()) errors.push('Lý do nghỉ phép không được để trống');

        if (!employeeId) {
            const emp = await Employee.findOne({ email: req.user.email });
            if (!emp) {
                errors.push('Không tìm thấy thông tin nhân viên tương ứng với tài khoản này');
            } else {
                employeeId = emp._id;
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors,
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Định dạng ngày tháng không hợp lệ'],
            });
        }

        if (start > end) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'],
            });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Nhân viên không tồn tại trong hệ thống'],
            });
        }

        const leave = await Leave.create({
            employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            reason: reason.trim(),
            status: 'pending',
        });

        res.status(201).json({
            message: 'Gửi đơn nghỉ phép thành công',
            data: leave,
        });
    } catch (error) {
        next(error);
    }
};

// Xem tất cả đơn nghỉ phép (admin, hr)
const getAllLeaves = async (req, res, next) => {
    try {
        const { employeeId, status, leaveType, page = 1, limit = 10 } = req.query;
        const query = {};

        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
        const totalItems = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .populate('employeeId', 'fullName employeeCode email departmentId positionId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy danh sách đơn nghỉ phép thành công',
            data: leaves,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
        });
    } catch (error) {
        next(error);
    }
};

// Xem đơn nghỉ của bản thân (admin, hr, staff)
const getMyLeaves = async (req, res, next) => {
    try {
        const emp = await Employee.findOne({ email: req.user.email });
        if (!emp) {
            return res.status(404).json({
                message: 'Không tìm thấy hồ sơ nhân viên liên kết với tài khoản này',
            });
        }

        const { status, leaveType, page = 1, limit = 10 } = req.query;
        const query = { employeeId: emp._id };

        if (status) query.status = status;
        if (leaveType) query.leaveType = leaveType;

        const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);
        const totalItems = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Lấy danh sách đơn nghỉ phép của bản thân thành công',
            data: leaves,
            pagination: formatPaginationResponse(totalItems, pageNum, limitNum),
        });
    } catch (error) {
        next(error);
    }
};

// Xem chi tiết đơn nghỉ (admin, hr, chủ đơn)
const getLeaveById = async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id).populate('employeeId', 'fullName employeeCode email');
        if (!leave) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Kiểm tra quyền nếu là staff: phải là chủ đơn
        if (req.user.role === 'staff') {
            const emp = await Employee.findOne({ email: req.user.email });
            if (!emp || String(leave.employeeId._id || leave.employeeId) !== String(emp._id)) {
                return res.status(403).json({
                    message: 'Bạn không có quyền thực hiện chức năng này',
                });
            }
        }

        res.status(200).json({
            message: 'Lấy chi tiết đơn nghỉ phép thành công',
            data: leave,
        });
    } catch (error) {
        next(error);
    }
};

// Duyệt đơn nghỉ (admin, hr)
const approveLeave = async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Nghiệp vụ: Không cho duyệt đơn đã được xử lý (chỉ duyệt khi pending)
        if (leave.status !== 'pending') {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không thể duyệt đơn nghỉ phép đã được xử lý'],
            });
        }

        leave.status = 'approved';
        await leave.save();

        // Tự động đánh dấu chấm công nghỉ phép (status: leave) cho các ngày nghỉ
        const cur = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        cur.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        while (cur <= end) {
            if (cur.getDay() !== 0) { // Bỏ qua Chủ nhật
                await Attendance.findOneAndUpdate(
                    { employeeId: leave.employeeId, date: new Date(cur) },
                    { employeeId: leave.employeeId, date: new Date(cur), status: 'leave' },
                    { upsert: true }
                );
            }
            cur.setDate(cur.getDate() + 1);
        }

        res.status(200).json({
            message: 'Duyệt đơn nghỉ phép thành công',
            data: leave,
        });
    } catch (error) {
        next(error);
    }
};

// Từ chối đơn nghỉ (admin, hr)
const rejectLeave = async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Nghiệp vụ: Không cho từ chối đơn đã được xử lý (chỉ từ chối khi pending)
        if (leave.status !== 'pending') {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Không thể từ chối đơn nghỉ phép đã được xử lý'],
            });
        }

        leave.status = 'rejected';
        await leave.save();

        res.status(200).json({
            message: 'Từ chối đơn nghỉ phép thành công',
            data: leave,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLeave,
    getAllLeaves,
    getMyLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
};
