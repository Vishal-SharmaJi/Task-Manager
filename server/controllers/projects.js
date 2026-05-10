const Joi = require('joi');
const db = require('../db');

const mapMember = (member) => ({
  id: String(member.id),
  _id: String(member.id),
  name: member.name,
  email: member.email
});

const mapProjectRow = (row) => ({
  _id: String(row.id),
  id: String(row.id),
  name: row.name,
  description: row.description || '',
  members: (row.members || []).map(mapMember),
  createdBy: {
    id: String(row.created_by),
    _id: String(row.created_by),
    name: row.created_by_name,
    email: row.created_by_email
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const projectSelect = `
  SELECT
    p.id,
    p.name,
    p.description,
    p.created_by,
    p.created_at,
    p.updated_at,
    creator.name AS created_by_name,
    creator.email AS created_by_email,
    COALESCE(
      json_agg(
        json_build_object(
          'id', member.id,
          'name', member.name,
          'email', member.email
        )
      ) FILTER (WHERE member.id IS NOT NULL),
      '[]'
    ) AS members
  FROM projects p
  JOIN users creator ON creator.id = p.created_by
  LEFT JOIN project_members pm ON pm.project_id = p.id
  LEFT JOIN users member ON member.id = pm.user_id
`;

const projectGroup = `
  GROUP BY p.id, creator.name, creator.email
`;

exports.createProject = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const schema = Joi.object({
      name: Joi.string().required().trim(),
      description: Joi.string().allow('').trim(),
      members: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.number()))
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, description, members = [] } = req.body;

    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name.trim(), description || '', req.user.id]
    );

    const projectId = projectResult.rows[0].id;
    const uniqueMembers = [...new Set(members.filter(Boolean).map(String))];

    for (const userId of uniqueMembers) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [projectId, userId]
      );
    }

    await client.query('COMMIT');

    const created = await db.query(
      `${projectSelect}
       WHERE p.id = $1
       ${projectGroup}`,
      [projectId]
    );

    res.status(201).json(mapProjectRow(created.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error while creating project' });
  } finally {
    client.release();
  }
};

exports.getProjects = async (req, res) => {
  try {
    const params = [];
    let where = '';

    if (req.user.role !== 'Admin') {
      params.push(req.user.id);
      where = `
        WHERE p.created_by = $1
        OR EXISTS (
          SELECT 1 FROM project_members scoped_pm
          WHERE scoped_pm.project_id = p.id AND scoped_pm.user_id = $1
        )
      `;
    }

    const result = await db.query(
      `${projectSelect}
       ${where}
       ${projectGroup}
       ORDER BY p.created_at DESC`,
      params
    );

    res.json(result.rows.map(mapProjectRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const result = await db.query(
      `${projectSelect}
       WHERE p.id = $1
       ${projectGroup}`,
      [req.params.id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = mapProjectRow(row);
    const canView =
      req.user.role === 'Admin' ||
      project.createdBy.id === req.user.id ||
      project.members.some(member => member.id === req.user.id);

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await db.query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
    if (!project.rows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    const inserted = await db.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING project_id`,
      [req.params.id, userId]
    );

    if (!inserted.rows[0]) {
      return res.status(400).json({ message: 'User already a member' });
    }

    const updatedProject = await db.query(
      `${projectSelect}
       WHERE p.id = $1
       ${projectGroup}`,
      [req.params.id]
    );

    res.json(mapProjectRow(updatedProject.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id, userId } = req.params;

    await client.query('BEGIN');

    const project = await client.query(
      'SELECT id, created_by FROM projects WHERE id = $1',
      [id]
    );

    if (!project.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Project not found' });
    }

    if (String(project.rows[0].created_by) === String(userId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Project creator cannot be removed' });
    }

    const removed = await client.query(
      `DELETE FROM project_members
       WHERE project_id = $1 AND user_id = $2
       RETURNING project_id`,
      [id, userId]
    );

    if (!removed.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Member not found in this project' });
    }

    await client.query(
      `UPDATE tasks
       SET assigned_to = NULL, updated_at = NOW()
       WHERE project_id = $1 AND assigned_to = $2`,
      [id, userId]
    );

    await client.query('COMMIT');

    const updatedProject = await db.query(
      `${projectSelect}
       WHERE p.id = $1
       ${projectGroup}`,
      [id]
    );

    res.json(mapProjectRow(updatedProject.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error while removing member' });
  } finally {
    client.release();
  }
};
