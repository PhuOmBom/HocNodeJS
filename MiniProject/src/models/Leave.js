const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'employeeId là bắt buộc'],
        },
        leaveType: {
            type: String,
            required: [true, 'Loại nghỉ phép là bắt buộc'],
            enum: {
                values: ['annual', 'sick', 'unpaid'],
                message: '{VALUE} không phải loại nghỉ phép hợp lệ (chỉ nhận: annual, sick, unpaid)',
            },
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc'],
        },
        reason: {
            type: String,
            required: [true, 'Lý do nghỉ phép không được để trống'],
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: '{VALUE} không phải trạng thái hợp lệ (chỉ nhận: pending, approved, rejected)',
            },
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;