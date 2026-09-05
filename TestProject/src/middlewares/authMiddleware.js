const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const headerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const token = headerToken || req.cookies.auth_token;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findOne({ userID: payload.userID });
    if (!req.user) return res.status(401).json({ message: 'User account was not found.' });
    if (req.user.isBanned) return res.status(403).json({ message: 'This account has been suspended.' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Your session has expired.' });
  }
}

module.exports = authMiddleware;