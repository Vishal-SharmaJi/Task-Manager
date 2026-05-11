import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { Plus, Folder, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setPageError('');
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setPageError(err.response?.data?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError('');
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      await fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      setCreateError(err.response?.data?.message || 'Unable to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateError('');
    setShowModal(true);
  };

  const closeCreateModal = () => {
    if (createLoading) return;
    setCreateError('');
    setShowModal(false);
  };

  if (loading) return <div className="text-primary-700">Loading projects...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-950 mb-2">Projects</h2>
          <p className="text-slate-500">Manage and track all your active projects.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary-200"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      {pageError && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-600">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/projects/${project._id}`} className="group block glass-card p-6 h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                  <Folder size={24} />
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!window.confirm(`Delete project "${project.name}"? This will also delete its tasks.`)) return;
                        (async () => {
                          try {
                            await api.delete(`/projects/${project._id}`);
                            await fetchProjects();
                          } catch (err) {
                            console.error('Error deleting project:', err);
                            setPageError(err.response?.data?.message || 'Unable to delete project.');
                          }
                        })();
                      }}
                      className="text-slate-300 hover:text-blue-600 transition-colors"
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  )}
                  <ChevronRight className="text-slate-300 group-hover:text-accent-500 transition-colors" size={20} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-2 group-hover:text-primary-700 transition-colors">{project.name}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2">{project.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-primary-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users size={16} />
                  <span className="text-xs">{project.members?.length || 0} Members</span>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full border border-primary-100">Open to assign</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-950 mb-6">Create New Project</h3>
            {createError && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-600">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="E.g. Website Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-white border border-primary-200 rounded-lg py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 min-h-[100px]"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300 transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
