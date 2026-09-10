const errorHandler = (err, req, res, next) => {
    console.error("Code ngu lắm em ơi!", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi hệ thống nội bộ';

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} đã tồn tại`;
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errorList = Object.values(err.errors).map((item) => item.message);
        return res.status(statusCode).json({
            message: 'Dữ liệu ko hợp lệ',
            errors: errorList,
        });
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Định dạng ID ko hợp lệ: ${err.value}`;
    }

    res.status(statusCode).json({
        message: message,
    })
}

module.exports = errorHandler