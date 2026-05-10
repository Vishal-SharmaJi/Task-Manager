const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, updateTaskStatus, deleteTask, getDashboardStats } = require('../controllers/tasks');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/', auth, isAdmin, createTask);
router.get('/project/:projectId', auth, getTasksByProject);
router.patch('/:id', auth, isAdmin, updateTask);
router.patch('/:id/status', auth, updateTaskStatus);
router.delete('/:id', auth, isAdmin, deleteTask);
router.get('/stats', auth, getDashboardStats);

module.exports = router;
