const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        leaveType: {
            type: String,
            enum: {
                values: ['annual', 'sick', 'unpaid'],
                message: '{VALUE} ko phai la loai nghi phep hop le'
            },
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: '{VALUE} ko phai la trang thai hop le'
            },
            default: 'pending',
        }
    },
    {
        timestamps: true,
    }
);

const Leave = mongoose.model('Leave', userSchema);

module.exports = Leave;