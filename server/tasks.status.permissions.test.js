/*
  Unit tests for updateTaskStatus permissions.
  Runner: Node built-in test runner (node --test)

  These tests DO NOT require a real database.
  They mock `db.query` and simulate authorization outcomes.
*/

const test = require('node:test');
const assert = require('node:assert/strict');

// Helper: create a mock response object
const createRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

// Mock db module before requiring controller
const path = require('node:path');
const dbPath = path.join(process.cwd(), 'server', 'db.js');

// We'll replace require cache for db.js each test.
const controllerPath = path.join(process.cwd(), 'server', 'controllers', 'tasks.js');

const resetModule = (modulePath) => {
  delete require.cache[require.resolve(modulePath)];
};

test('updateTaskStatus: returns 403 when user is not assigned and not admin/creator', async () => {
  // Arrange
  let callIndex = 0;

  const taskRow = { id: 'task-1', project_id: 'proj-1', assigned_to: 'other-user' };

  const mockDb = {
    query: async (sql, params) => {
      callIndex += 1;

      // 1) fetch existing task
      if (callIndex === 1) {
        assert.match(String(sql), /SELECT id, project_id, assigned_to FROM tasks/i);
        assert.deepEqual(params, ['task-1']);
        return { rows: [taskRow] };
      }

      // 2) creator check
      if (callIndex === 2) {
        assert.match(String(sql), /SELECT 1 FROM projects WHERE id = \$1 AND created_by = \$2/i);
        assert.deepEqual(params, ['proj-1', 'user-999']);
        return { rows: [] };
      }

      // should not update/select when unauthorized
      throw new Error('Unexpected query after authorization check');
    }
  };

  resetModule(dbPath);
  require.cache[require.resolve(dbPath)] = { exports: mockDb };
  resetModule(controllerPath);

  const { updateTaskStatus } = require(controllerPath);

  const req = {
    params: { id: 'task-1' },
    body: { status: 'Completed' },
    user: { id: 'user-999', role: 'Member' }
  };
  const res = createRes();

  // Act
  await updateTaskStatus(req, res);

  // Assert
  assert.equal(res.statusCode, 403);
  assert.equal(res.body?.message, 'Not authorized to update task status');
  assert.equal(callIndex, 2);
});

test('updateTaskStatus: updates and returns task when user is assigned', async () => {
  // Arrange
  let callIndex = 0;

  const mockDb = {
    query: async (sql, params) => {
      callIndex += 1;

      // 1) fetch existing task
      if (callIndex === 1) {
        return { rows: [{ id: 'task-1', project_id: 'proj-1', assigned_to: 'user-5' }] };
      }

      // 2) creator check
      if (callIndex === 2) {
        return { rows: [] };
      }

      // 3) update
      if (callIndex === 3) {
        return { rows: [{ id: 'task-1' }] };
      }

      // 4) final select with taskSelect mapping fields
      if (callIndex === 4) {
        return {
          rows: [
            {
              id: 1,
              title: 'T1',
              description: 'D',
              project_id: 10,
              assigned_to: 5,
              assigned_to_name: 'Vishal',
              assigned_to_email: 'vishal@test.com',
              status: 'Completed',
              deadline: null,
              created_at: new Date('2020-01-01'),
              updated_at: new Date('2020-01-02')
            }
          ]
        };
      }

      throw new Error('Unexpected query');
    }
  };

  resetModule(dbPath);
  require.cache[require.resolve(dbPath)] = { exports: mockDb };
  resetModule(controllerPath);

  const { updateTaskStatus } = require(controllerPath);

  const req = {
    params: { id: 'task-1' },
    body: { status: 'Completed' },
    user: { id: 'user-5', role: 'Member' }
  };
  const res = createRes();

  // Act
  await updateTaskStatus(req, res);

  // Assert
  assert.equal(res.statusCode, 200);
  assert.equal(res.body?._id, '1');
  assert.equal(res.body?.status, 'Completed');
  assert.equal(callIndex, 4);
});

test('updateTaskStatus: returns 400 for invalid status', async () => {
  // Arrange
  const mockDb = {
    query: async () => {
      throw new Error('Should not call db for invalid status');
    }
  };

  resetModule(dbPath);
  require.cache[require.resolve(dbPath)] = { exports: mockDb };
  resetModule(controllerPath);

  const { updateTaskStatus } = require(controllerPath);

  const req = {
    params: { id: 'task-1' },
    body: { status: 'INVALID_STATUS' },
    user: { id: 'user-1', role: 'Admin' }
  };
  const res = createRes();

  // Act
  await updateTaskStatus(req, res);

  // Assert
  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.message, 'Invalid task status');
});

