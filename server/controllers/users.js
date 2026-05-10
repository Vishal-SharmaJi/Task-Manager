const db = require('../db');

exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role
       FROM users
       ORDER BY name ASC, email ASC`
    );

    res.json(result.rows.map(user => ({
      id: String(user.id),
      _id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};
