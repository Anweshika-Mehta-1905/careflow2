import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  Calendar,
  Bed,
  Pill,
  ReceiptText,
  LogOut,
  Activity,
  X,
} from 'lucide-react';

export interface AppSidebarProps {
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  userEmail?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onLogout,
  isMobileOpen,
  onMobileClose,
  userEmail = 'admin@hospital.org',
}) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Doctors', path: '/doctors', icon: UserRound },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Admissions & Beds', path: '/admissions', icon: Bed },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
    { name: 'Billing', path: '/billing', icon: ReceiptText },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A1C16] text-[#A3C2B6] border-r border-[#16382E] select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#16382E] bg-[#081712]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base tracking-tight text-white font-sans">
              CareFlow
            </span>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400">
              HMS
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600/20 text-white border border-emerald-500/30'
                  : 'text-[#8EAFA3] hover:text-white hover:bg-[#122D24]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-[#688D80]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-[#16382E] bg-[#081712]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0D241C] border border-[#16382E] mb-2">
          <div className="w-7 h-7 rounded-md bg-emerald-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Administrator</p>
            <p className="text-[11px] text-emerald-400/70 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#8EAFA3] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed 240px) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
