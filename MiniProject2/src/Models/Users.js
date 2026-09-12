const mongoose = require('mongoose');

const { Schema } = mongoose

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, "Name is required"],
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'librarian', 'member'],
                message: '{VALUE} invalid role',
            },
            default: 'member',
            required: true,
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: '{VALUES} invalid status',
            },
            default: 'active',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;