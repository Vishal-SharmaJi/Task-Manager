const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../db');

const publicUser = (user) => ({
  id: String(user.id),
  _id: String(user.id),
  name: user.name,
  email: user.email,
  role: user.role
});

exports.register = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required().min(2),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6),
      role: Joi.string().valid('Admin', 'Member')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), email.trim(), passwordHash, role || 'Member']
    );

    res.status(201).json({
      message: 'Registration successful. Please sign in.',
      user: publicUser(result.rows[0])
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'User already exists' });
    }

    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = LOWER($1)',
      [email.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: publicUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'User not found, access denied.' });
    }

    res.json(publicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
