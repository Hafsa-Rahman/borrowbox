/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 * Usage: requireRole('admin')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not logged in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }
    next();
  };
}

module.exports = { requireRole };
