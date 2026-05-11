import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { CheckCircle2, Clock, ListTodo, AlertCircle, TrendingUp, X, BarChart3, Users, Target, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const [recentActivity, setRecentActivity] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();

    // Keep recent activity fresh without relying on parent page navigation.
    const intervalId = setInterval(() => {
      fetchRecentActivity();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/tasks/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setRecentLoading(true);
      setRecentError('');
      const res = await api.get('/tasks/recent-activity', { params: {} });
      console.log('recent-activity payload:', res.data);
      setRecentActivity(res.data || []);
    } catch (err) {
      console.error('Error fetching recent activity:', err);

      const status = err.response?.status;
      const dataMessage = err.response?.data?.message;
      const requestUrl = err.config?.url;
      const fullMessage =
        `Recent Activity failed. status=${status || 'unknown'} ` +
        `url=${requestUrl || 'unknown'} ` +
        `${dataMessage ? `message=${dataMessage}` : ''}`;

      const msg = dataMessage || err.message || fullMessage;
      setRecentError(fullMessage);
      setRecentActivity([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Calculate derived stats for the report
  const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';
  const inProgressRate = stats.total > 0 ? ((stats.inProgress / stats.total) * 100).toFixed(1) : '0';
  const todoRate = stats.total > 0 ? ((stats.todo / stats.total) * 100).toFixed(1) : '0';
  const overdueRate = stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : '0';

  if (loading) return <div className="text-primary-700">Loading stats...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-950 mb-2">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back! Here's what's happening with your projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-950">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-slate-950 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentError ? (
              <div className="text-red-600 text-sm">{recentError}</div>
            ) : recentLoading ? (
              <div className="text-slate-500 text-sm">Loading recent activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-slate-500 text-sm">No recent activity.</div>
            ) : (
              recentActivity.slice(0, 5).map((activity) => (
                <div key={activity._id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm">
                      <span className="font-bold text-slate-900">Activity</span>:
                      {' '}
                      <span className="text-accent-600 font-medium">{activity.title}</span>
                      {' '}
                      <span className="text-slate-600">updated to</span>
                      {' '}
                      <span className="font-medium text-slate-900">{activity.status}</span>
                    </p>
                    {activity.updatedAt ? (
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(activity.updatedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-full bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600 mb-6">
              <TrendingUp size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-950 mb-2">Team Productivity</h3>
            <p className="text-slate-500 max-w-xs">Your team has completed {completionRate}% of all tasks. {stats.overdue > 0 ? `${stats.overdue} tasks are overdue and need attention.` : 'Everything is on track!'}</p>
            <button
              onClick={() => setShowReport(true)}
              className="mt-8 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all shadow-sm shadow-primary-200"
            >
              View Detailed Report
            </button>
        </div>
      </div>

      {/* Detailed Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Detailed Productivity Report</h2>
                  <p className="text-sm text-slate-500">Overview of all tasks and team performance</p>
                </div>
              </div>
              <button
                onClick={() => setShowReport(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <Target className="text-primary-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-slate-950">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Tasks</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <CheckCircle2 className="text-emerald-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-slate-950">{stats.completed}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <TrendingUp className="text-amber-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-slate-950">{stats.inProgress}</p>
                  <p className="text-xs text-slate-500">In Progress</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <AlertCircle className="text-red-600 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-bold text-slate-950">{stats.overdue}</p>
                  <p className="text-xs text-slate-500">Overdue</p>
                </div>
              </div>

              {/* Task Status Distribution */}
              <div>
                <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-primary-600" />
                  Task Status Distribution
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Completed</span>
                      <span className="text-slate-500">{stats.completed} tasks ({completionRate}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">In Progress</span>
                      <span className="text-slate-500">{stats.inProgress} tasks ({inProgressRate}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${inProgressRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Todo</span>
                      <span className="text-slate-500">{stats.todo} tasks ({todoRate}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${todoRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Overdue</span>
                      <span className="text-red-500">{stats.overdue} tasks ({overdueRate}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${overdueRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div>
                <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-primary-600" />
                  Performance Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="font-semibold text-slate-900">Completion Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 mb-1">{completionRate}%</p>
                    <p className="text-sm text-slate-500">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-red-100 text-red-600">
                        <AlertCircle size={18} />
                      </div>
                      <p className="font-semibold text-slate-900">Overdue Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600 mb-1">{overdueRate}%</p>
                    <p className="text-sm text-slate-500">
                      {stats.overdue} tasks past deadline
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <TrendingUp size={18} />
                      </div>
                      <p className="font-semibold text-slate-900">Active Tasks</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-600 mb-1">{stats.inProgress}</p>
                    <p className="text-sm text-slate-500">
                      Tasks currently in progress
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                        <ListTodo size={18} />
                      </div>
                      <p className="font-semibold text-slate-900">Pending Tasks</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600 mb-1">{stats.todo}</p>
                    <p className="text-sm text-slate-500">
                      Tasks not yet started
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity in Report */}
              {recentActivity.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary-600" />
                    Latest Task Updates
                  </h3>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          activity.status === 'Completed' ? 'bg-emerald-500' :
                          activity.status === 'In Progress' ? 'bg-amber-500' :
                          activity.status === 'Todo' ? 'bg-primary-500' : 'bg-slate-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                          <p className="text-xs text-slate-400">
                            Updated to <span className="font-medium">{activity.status}</span>
                            {activity.updatedAt && ` — ${new Date(activity.updatedAt).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowReport(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
              >
                Close Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;