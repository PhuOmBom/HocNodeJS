const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi hệ thống nội bộ';

    if (err.name === 'ValidationError') {
        const errorList = Object.values(err.errors).map((item) => item.message);
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: errorList,
        });
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Định dạng ID không hợp lệ: ${err.value}`;
    }

    res.status(statusCode).json({
        message,
    });
};

module.exports = errorHandler;