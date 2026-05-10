const jwt = require('jsonwebtoken');
const db = require('../db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied.' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      return res.status(401).json({ message: 'Token verification failed, access denied.' });
    }

    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [verified.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'User not found, access denied.' });
    }

    req.user = {
      id: String(user.id),
      _id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token, access denied.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

module.exports = { auth, isAdmin };
