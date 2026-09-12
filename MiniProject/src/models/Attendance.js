const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'employeeId là bắt buộc'],
        },
        date: {
            type: Date,
            required: [true, 'Ngày điểm danh là bắt buộc'],
        },
        checkIn: {
            type: Date,
        },
        checkOut: {
            type: Date,
        },
        workingHours: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: {
                values: ['present', 'late', 'absent', 'leave'],
                message: '{VALUE} không phải trạng thái hợp lệ (chỉ nhận: present, late, absent, leave)',
            },
            default: 'present',
        },
    },
    {
        timestamps: true,
    }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;