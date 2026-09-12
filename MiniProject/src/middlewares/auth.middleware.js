const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập để thực hiện chức năng này',
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Token xác thực không hợp lệ',
            });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({
                message: 'Token không hợp lệ hoặc đã hết hạn',
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                message: 'Tài khoản người dùng không tồn tại',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa hoặc ngừng hoạt động',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    verifyAuth,
};
