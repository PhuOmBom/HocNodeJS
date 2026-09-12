const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: [true, 'Mã nhân viên không được để trống'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        fullName: {
            type: String,
            required: [true, 'Họ và tên nhân viên không được để trống'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email là bắt buộc'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không đúng định dạng'],
        },
        phone: {
            type: String,
            required: [true, 'Số điện thoại không được để trống'],
            trim: true,
        },
        gender: {
            type: String,
            required: [true, 'Giới tính là bắt buộc'],
            enum: {
                values: ['male', 'female', 'other'],
                message: '{VALUE} không phải giới tính hợp lệ (chỉ nhận: male, female, other)',
            },
        },
        dateOfBirth: {
            type: Date,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: [true, 'Phòng ban là bắt buộc'],
        },
        positionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position',
            required: [true, 'Chức vụ là bắt buộc'],
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        salary: {
            type: Number,
            required: [true, 'Mức lương là bắt buộc'],
            min: [0, 'Lương phải lớn hơn hoặc bằng 0'],
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: {
                values: ['probation', 'active', 'inactive', 'resigned'],
                message: '{VALUE} không phải trạng thái hợp lệ (chỉ nhận: probation, active, inactive, resigned)',
            },
            default: 'probation',
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        note: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
