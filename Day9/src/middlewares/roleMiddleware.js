/**
 * Middleware kiểm tra quyền truy cập dựa trên danh sách role được phép
 * @param  {...string} allowedRoles - Danh sách các role có quyền truy cập (vd: "admin")
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action",
      });
    }
    next();
  };
}

module.exports = authorizeRoles;
