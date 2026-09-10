const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        baseSalary: {
            type: Number,
            required: true,
            min: [0, 'Có định trả lương ko ae?']
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: '{VALUE} ko phai trang thai hop le'
            },
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

const Position = mongoose.model('Position', userSchema);

module.exports = Position;