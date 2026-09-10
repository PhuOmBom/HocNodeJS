const mongoose = require('mongoose');

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

const Department = mongoose.model('Department', userSchema);

module.exports = Department;