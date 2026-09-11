const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

const register = async (req, res, next) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Họ tên, email và mật khẩu là bắt buộc.',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 6 ký tự.',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: 'Email này đã được đăng ký tài khoản.',
            });
        }

        // Quyền admin/hr chỉ được cấp nếu có admin chỉ định hoặc là tài khoản đầu tiên
        let assignedRole = 'staff';
        if (role && ['admin', 'hr', 'staff'].includes(role)) {
            const userCount = await User.countDocuments();
            if (userCount === 0 || (req.user && req.user.role === 'admin')) {
                assignedRole = role;
            }
        }

        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password,
            role: assignedRole,
        });

        const token = generateToken({ id: user._id, role: user.role });

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công.',
            token,
            user,
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
                message: 'Vui lòng nhập đầy đủ email và mật khẩu.',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác.',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không chính xác.',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.',
            });
        }

        const token = generateToken({ id: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công.',
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
            success: true,
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            });
        }

        // Lấy lại user bao gồm trường password
        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Mật khẩu hiện tại không đúng.',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    changePassword,
};
