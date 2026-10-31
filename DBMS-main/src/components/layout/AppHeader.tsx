import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Calendar as CalendarIcon } from 'lucide-react';

export interface AppHeaderProps {
  onMobileOpen: () => void;
  userEmail?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMobileOpen, userEmail }) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/patients':
        return 'Patients';
      case '/doctors':
        return 'Doctors';
      case '/departments':
        return 'Departments';
      case '/appointments':
        return 'Appointments';
      case '/admissions':
        return 'Admissions & Beds';
      case '/pharmacy':
        return 'Pharmacy';
      case '/billing':
        return 'Billing';
      default:
        return 'CareFlow HMS';
    }
  };

  const title = getPageTitle(location.pathname);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: Date & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>{formattedDate}</span>
        </div>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
          {userEmail ? userEmail.slice(0, 1).toUpperCase() : 'A'}
        </div>
      </div>
    </header>
  );
};
