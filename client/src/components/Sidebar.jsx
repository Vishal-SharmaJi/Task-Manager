import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, isAdmin } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
  ];

  return (
    <aside className="w-64 border-r border-primary-100 flex flex-col bg-white/95 shadow-sm">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-primary-700">
          <CheckSquare className="text-accent-500" />
          <span>TaskFlow</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                  : 'text-slate-600 hover:bg-accent-50 hover:text-accent-700'
              }`
            }
          >
            <link.icon size={20} />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
