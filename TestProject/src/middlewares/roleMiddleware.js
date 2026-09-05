function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user.role === 'user' ? 'customer' : req.user.role;
    if (!allowedRoles.includes(role)) return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    next();
  };
}

module.exports = requireRoles;