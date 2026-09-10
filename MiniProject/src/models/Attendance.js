const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
        },
        date: {
            type: Date,
        },
        checkIn: {
            type: Date,
        },
        checkOut: {
            type: Date,
        },
        workingHours: {
            type: Number,
        },
        status: {
            type: String,
            enum: {
                values: ['present', 'late', 'absent', 'leave'],
                message: '{VALUE} ko phai la trang thai hop le',
            },
        }
    },
    {
        timestamps: true,
    }
);

const Attendance = mongoose.model('Attendance', userSchema);

module.exports = Attendance;