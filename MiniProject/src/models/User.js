const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
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
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
        },
        password: {
            type: String,
            required: true,
            minlength: [6, 'Pass min 6 nhé ae']
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: '{VALUE} không phải trạng thái hợp lệ',
            },
            default: 'active',
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'hr', 'staff'],
                message: '{VALUE} không phải vai trò hợp lệ'
            },
            default: 'staff',
        }
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();

    delete userObject.password;

    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;