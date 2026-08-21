import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Briefcase, GraduationCap, Award, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Career Profile', path: '/career', icon: Target },
    { name: 'Jobs Applied', path: '/jobs', icon: Briefcase },
    { name: 'Courses & Notes', path: '/courses', icon: GraduationCap },
    { name: 'Skills Catalog', path: '/skills', icon: Award },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-tight">JobOS</h1>
            <p className="text-[11px] text-slate-400 font-medium">Career Operating System</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )
              }
            >
              <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {user?.first_name ? user.first_name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
