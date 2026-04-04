const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Admin credentials can come from .env.
// Example .env values:
// ADMIN_EMAIL=admin@smartnav.com
// ADMIN_PASSWORD=admin123
// JWT_SECRET=your-super-secret-key
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smartnav.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'smartnav-dev-secret';

// POST /api/admin/login
// Returns a JWT token when the admin email and password are valid.
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({
    message: 'Login successful',
    token
  });
});

module.exports = router;