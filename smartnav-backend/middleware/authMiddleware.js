const jwt = require('jsonwebtoken');

// Middleware to protect admin-only routes.
// It expects: Authorization: Bearer <token>
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'smartnav-dev-secret';
    req.admin = jwt.verify(token, secret);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
};

module.exports = authMiddleware;