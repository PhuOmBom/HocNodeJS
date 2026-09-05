const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign({ userID: user.userID, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

function setAuthCookie(res, token) {
  res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 1000 });
}

module.exports = { signToken, setAuthCookie };