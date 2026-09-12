const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên chức vụ không được để trống'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Mã chức vụ không được để trống'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        baseSalary: {
            type: Number,
            required: [true, 'Lương cơ bản là bắt buộc'],
            min: [0, 'Lương phải lớn hơn hoặc bằng 0'],
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

const Position = mongoose.model('Position', positionSchema);

module.exports = Position;