const db = require('../db');

const mapTaskRow = (row) => ({
  _id: String(row.id),
  id: String(row.id),
  title: row.title,
  description: row.description || '',
  projectId: String(row.project_id),
  assignedTo: row.assigned_to
    ? {
        id: String(row.assigned_to),
        _id: String(row.assigned_to),
        name: row.assigned_to_name,
        email: row.assigned_to_email
      }
    : null,
  status: row.status,
  deadline: row.deadline,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const taskSelect = `
  SELECT
    t.id,
    t.title,
    t.description,
    t.project_id,
    t.assigned_to,
    t.status,
    t.deadline,
    t.created_at,
    t.updated_at,
    assignee.name AS assigned_to_name,
    assignee.email AS assigned_to_email
  FROM tasks t
  LEFT JOIN users assignee ON assignee.id = t.assigned_to
`;

const isProjectMember = async (userId, projectId) => {
  const assignee = await db.query(
    `SELECT u.id
     FROM users u
     WHERE u.id = $1
     AND (
       EXISTS (
         SELECT 1 FROM project_members pm
         WHERE pm.project_id = $2 AND pm.user_id = u.id
       )
       OR EXISTS (
         SELECT 1 FROM projects p
         WHERE p.id = $2 AND p.created_by = u.id
       )
     )`,
    [userId, projectId]
  );

  return Boolean(assignee.rows[0]);
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, deadline } = req.body;

    const project = await db.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (!project.rows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (assignedTo) {
      if (!(await isProjectMember(assignedTo, projectId))) {
        return res.status(400).json({ message: 'Assigned user must be a member of this project' });
      }
    }

    const result = await db.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, deadline, status)
       VALUES ($1, $2, $3, $4, $5, 'Todo')
       RETURNING id`,
      [
        title,
        description || '',
        projectId,
        assignedTo || null,
        deadline || null
      ]
    );

    const task = await db.query(`${taskSelect} WHERE t.id = $1`, [result.rows[0].id]);
    res.status(201).json(mapTaskRow(task.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!['Todo', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const existingTask = await db.query(
      'SELECT id, project_id FROM tasks WHERE id = $1',
      [req.params.id]
    );

    if (!existingTask.rows[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectId = existingTask.rows[0].project_id;

    if (assignedTo && !(await isProjectMember(assignedTo, projectId))) {
      return res.status(400).json({ message: 'Assigned user must be a member of this project' });
    }

    await db.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           assigned_to = $3,
           deadline = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        title.trim(),
        description || '',
        assignedTo || null,
        deadline || null,
        status,
        req.params.id
      ]
    );

    const task = await db.query(`${taskSelect} WHERE t.id = $1`, [req.params.id]);
    res.json(mapTaskRow(task.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    const tasks = await db.query(
      `${taskSelect}
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.projectId]
    );

    res.json(tasks.rows.map(mapTaskRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Todo', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const result = await db.query(
      `UPDATE tasks
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [status, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await db.query(`${taskSelect} WHERE t.id = $1`, [req.params.id]);
    res.json(mapTaskRow(task.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const params = [];
    let where = '';

    if (req.user.role !== 'Admin') {
      params.push(req.user.id);
      where = 'WHERE assigned_to = $1';
    }

    const result = await db.query(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Todo')::int AS todo,
        COUNT(*) FILTER (WHERE status = 'In Progress')::int AS "inProgress",
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed,
        COUNT(*) FILTER (
          WHERE status <> 'Completed'
          AND deadline IS NOT NULL
          AND deadline < NOW()
        )::int AS overdue
       FROM tasks
       ${where}`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
