const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên phòng ban không được để trống'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Mã phòng ban không được để trống'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: '{VALUE} không phải trạng thái hợp lệ (chỉ nhận: active, inactive)',
            },
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;