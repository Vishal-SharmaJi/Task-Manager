import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 border-b border-primary-100 flex items-center justify-between px-8 glass sticky top-0 z-10 bg-white/90">
      <div className="flex items-center gap-4 bg-primary-50/80 px-4 py-2 rounded-full border border-primary-100 w-96">
        <Search size={18} className="text-primary-500" />
        <input
          type="text"
          placeholder="Search tasks or projects..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-slate-500 hover:text-accent-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-primary-100">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-accent-600 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
