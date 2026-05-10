import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import { Plus, Calendar, Trash2, CheckCircle2, Clock, ListTodo, UserPlus, Pencil, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', status: 'Todo' });
  const [selectedMember, setSelectedMember] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [taskError, setTaskError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/project/${id}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const addMember = async () => {
    if (!selectedMember) return;

    try {
      setMemberLoading(true);
      setMemberError('');
      const res = await api.post(`/projects/${id}/members`, { userId: selectedMember });
      setProject(res.data);
      setSelectedMember('');
    } catch (err) {
      console.error('Error adding member:', err);
      setMemberError(err.response?.data?.message || 'Unable to add member.');
    } finally {
      setMemberLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!memberId) return;
    if (!window.confirm('Remove this member from the project? Their assigned tasks will become unassigned.')) return;

    try {
      setRemovingMemberId(String(memberId));
      setMemberError('');
      const res = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(res.data);
      fetchTasks();
    } catch (err) {
      console.error('Error removing member:', err);
      setMemberError(err.response?.data?.message || 'Unable to remove member.');
    } finally {
      setRemovingMemberId('');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setTaskError('');
      if (editingTask) {
        await api.patch(`/tasks/${editingTask._id}`, taskForm);
      } else {
        await api.post('/tasks', { ...taskForm, projectId: id });
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', assignedTo: '', deadline: '', status: 'Todo' });
      fetchTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      setTaskError(err.response?.data?.message || 'Unable to save task.');
    }
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskError('');
    setTaskForm({ title: '', description: '', assignedTo: '', deadline: '', status: 'Todo' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskError('');
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo?._id || task.assignedTo?.id || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : '',
      status: task.status || 'Todo'
    });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskError('');
    setTaskForm({ title: '', description: '', assignedTo: '', deadline: '', status: 'Todo' });
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const columns = [
    { id: 'Todo', title: 'To Do', icon: ListTodo, color: 'text-accent-500' },
    { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-primary-600' },
    { id: 'Completed', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  ];

  const memberIds = new Set([
    ...(project?.members || []).map(member => member.id || member._id),
    project?.createdBy?.id || project?.createdBy?._id
  ].filter(Boolean).map(String));
  const availableUsers = users.filter(user => !memberIds.has(String(user.id || user._id)));
  const assignableMembers = [
    ...(project?.createdBy ? [{ ...project.createdBy, isCreator: true }] : []),
    ...(project?.members || []).map(member => ({ ...member, isCreator: false }))
  ];

  if (loading) return <div className="text-primary-700">Loading project...</div>;
  if (!project) return <div className="text-primary-700">Project not found.</div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-3xl font-bold text-slate-950">{project.name}</h2>
             <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs border border-primary-100">Active</span>
          </div>
          <p className="text-slate-500 max-w-2xl">{project.description}</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateTask}
            className="self-start bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} />
            Add Task
          </button>
        )}
      </div>

      <div className="rounded-lg border border-primary-100 bg-white/85 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Project Members</h3>
            <p className="text-sm text-slate-500">Add members here first, then choose them in the Add Task form.</p>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full sm:w-72 bg-white border border-primary-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              >
                <option value="">Select registered user</option>
                {availableUsers.map(user => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addMember}
                disabled={!selectedMember || memberLoading}
                className="bg-accent-50 hover:bg-accent-100 disabled:opacity-60 disabled:cursor-not-allowed text-accent-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all border border-accent-100"
              >
                <UserPlus size={18} />
                {memberLoading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {assignableMembers.map(member => (
            <span key={member._id || member.id} className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-accent-700">
                {member.name.charAt(0)}
              </span>
              {member.name}
              {member.isCreator && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">Creator</span>
              )}
              {isAdmin && !member.isCreator && (
                <button
                  type="button"
                  onClick={() => removeMember(member._id || member.id)}
                  disabled={removingMemberId === String(member._id || member.id)}
                  className="ml-1 rounded-full p-0.5 text-primary-500 hover:bg-white hover:text-rose-600 disabled:opacity-50"
                  title="Remove member"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {memberError && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
          {memberError}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-[600px]">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col h-full rounded-lg border border-primary-100 bg-white/80 shadow-sm">
            <div className="p-4 border-b border-primary-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <col.icon className={col.color} size={18} />
                <h3 className="font-bold text-slate-800">{col.title}</h3>
                <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-md">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {tasks.filter(t => t.status === col.id).map((task) => (
                <motion.div
                  key={task._id}
                  layoutId={task._id}
                  className="glass-card p-4 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">{task.title}</h4>
                    {isAdmin && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditTask(task)} className="text-slate-400 hover:text-primary-700 transition-colors" title="Edit task">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteTask(task._id)} className="text-slate-300 hover:text-rose-600 transition-colors" title="Delete task">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent-50 flex items-center justify-center text-[10px] text-accent-700 border border-accent-100">
                            {task.assignedTo?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[10px] text-slate-500">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    {task.deadline && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar size={10} />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-primary-100 flex gap-2">
                    {col.id !== 'Todo' && (
                        <button onClick={() => updateStatus(task._id, col.id === 'Completed' ? 'In Progress' : 'Todo')} className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100">
                            Move Back
                        </button>
                    )}
                    {col.id !== 'Completed' && (
                        <button onClick={() => updateStatus(task._id, col.id === 'Todo' ? 'In Progress' : 'Completed')} className="text-[10px] text-primary-700 hover:text-primary-800 px-2 py-1 rounded bg-primary-50">
                            {col.id === 'Todo' ? 'Start' : 'Complete'}
                        </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8">
            <h3 className="text-2xl font-bold text-slate-950 mb-6">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
            {taskError && (
              <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                {taskError}
              </div>
            )}
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                >
                  <option value="">Unassigned</option>
                  {assignableMembers.map(member => (
                    <option key={member._id || member.id} value={member._id || member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">Only project members appear here.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                >
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
