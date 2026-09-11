const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, 'Email ko hop le'],
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            required: true,
            enum: {
                values: ['male', 'female', 'other'],
                message: '{VALUE} ko phai gioi tinh hop le'
            }
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true,
        },
        positionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position',
            required: true,
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        salary: {
            type: Number,
            required: true,
            trim: true,
            min: [0, 'Co dinh tra luong ko?'],
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            enum: {
                values: ['probation', 'active', 'inactive', 'resigned'],
                message: '{VALUE} ko phai trang thai hop le',
            },
            default: 'probation',
        }
    },
    {
        timestamps: true,
    },
);

const Employee = mongoose.model('Employee', userSchema);

module.exports = Employee;