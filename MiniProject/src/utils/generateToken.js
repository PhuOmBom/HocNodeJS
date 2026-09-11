const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret_key_tam_thoi', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret_key_tam_thoi');
};

module.exports = {
    generateToken,
    verifyToken,
};