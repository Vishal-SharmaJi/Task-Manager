const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, deleteProject, addMember, removeMember } = require('../controllers/projects');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/', auth, isAdmin, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
router.delete('/:id', auth, isAdmin, deleteProject);
router.post('/:id/members', auth, isAdmin, addMember);
router.delete('/:id/members/:userId', auth, isAdmin, removeMember);

module.exports = router;
