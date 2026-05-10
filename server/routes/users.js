const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/users');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, isAdmin, getUsers);

module.exports = router;
