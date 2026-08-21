import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface NavbarProps {
  onToggleMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileNav }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/jobs')) return 'Job Applications';
    if (path.startsWith('/courses')) return 'Courses & Notes';
    if (path.startsWith('/skills')) return 'Skills Profile Catalog';
    if (path.startsWith('/settings')) return 'Application Settings';
    return 'Career Operating System';
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-slate-100">{getPageTitle(location.pathname)}</h2>
          <p className="text-xs text-slate-400 hidden sm:block">Track, analyze, learn, and match jobs seamlessly.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar Preview */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quick search jobs or skills..."
            className="bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Notifications Button */}
        <button className="relative text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </button>

        {/* User Pill */}
        <div className="h-8 border-l border-slate-800 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
            {user?.first_name ? user.first_name[0] : user?.email[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
