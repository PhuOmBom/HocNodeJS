const User = require('../models/User');

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        res.status(200).json({
            message: 'Lấy thông tin hồ sơ cá nhân thành công',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone, address, avatarUrl } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        // Không cho cập nhật role thông qua API hồ sơ cá nhân
        if (fullName !== undefined) user.fullName = fullName.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address !== undefined) user.address = address.trim();
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

        await user.save();

        res.status(200).json({
            message: 'Cập nhật hồ sơ cá nhân thành công',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Vui lòng nhập mật khẩu cũ và mật khẩu mới'],
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: ['Mật khẩu mới phải có tối thiểu 6 ký tự'],
            });
        }

        // Lấy user kèm password để so sánh
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: 'Không tìm thấy dữ liệu',
            });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Mật khẩu cũ không chính xác',
            });
        }

        // Mật khẩu mới sẽ được mã hóa tự động trong pre('save') của User
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            message: 'Đổi mật khẩu thành công',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
};
