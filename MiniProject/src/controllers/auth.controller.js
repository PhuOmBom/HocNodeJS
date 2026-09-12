const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

const register = async (req, res, next) => {
    try {
        const { fullName, email, password, role, status } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Họ và tên không được để trống'],
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Email là bắt buộc'],
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Mật khẩu phải có tối thiểu 6 ký tự'],
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Email đã tồn tại trong hệ thống'],
            });
        }

        let assignedRole = 'staff';
        if (role && ['admin', 'hr', 'staff'].includes(role)) {
            assignedRole = role;
        }

        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password,
            role: assignedRole,
            status: status || 'active',
        });

        res.status(201).json({
            message: 'Đăng ký tài khoản thành công',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Vui lòng nhập đầy đủ email và mật khẩu'],
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động',
            });
        }

        const token = generateToken({ id: user._id, role: user.role });

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            message: 'Lấy thông tin người dùng thành công',
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
};
