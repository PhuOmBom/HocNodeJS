const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập để thực hiện chức năng này',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Bạn không có quyền thực hiện chức năng này',
            });
        }

        next();
    };
};

module.exports = {
    checkRole,
};
