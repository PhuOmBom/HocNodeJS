const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập (Thiếu token xác thực).',
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Token không hợp lệ.',
            });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({
                message: 'Token không hợp lệ hoặc đã hết hạn.',
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                message: 'Tài khoản người dùng không tồn tại.',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập để thực hiện hành động này.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Quyền truy cập bị từ chối. Chỉ dành cho vai trò: ${roles.join(', ')}`,
            });
        }

        next();
    };
};

module.exports = {
    verifyAuth,
    checkRole,
};
