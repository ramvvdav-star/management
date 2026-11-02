import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Columns3,
  Users,
  Layers,
  FileSpreadsheet,
  Settings,
  Shield,
  X,
  KeyRound,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { AuthSession } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenCreateProject: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  session: AuthSession;
  onOpenPasskeyModal: () => void;
  activeProjectCount?: number;
  totalTaskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenCreateProject,
  isMobileOpen,
  onCloseMobile,
  session,
  onOpenPasskeyModal,
  activeProjectCount = 0,
  totalTaskCount = 0,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase, badge: activeProjectCount },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: totalTaskCount },
    { id: 'kanban', label: 'Kanban Board', icon: Columns3 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Shield className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                eSecurity<span className="text-cyan-400">In</span>
              </span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Project & Work Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => {
              onOpenCreateProject();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wide rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Project</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role / Authorization Box */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070b14] shrink-0 space-y-2">
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${session.isAuthenticated ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                <span className="font-bold text-slate-200">
                  {session.employeeName || (session.role === 'Manager' ? 'Manager Mode' : 'Guest Viewer')}
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono block">
                Role: {session.role}
              </span>
            </div>

            <button
              onClick={onOpenPasskeyModal}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Change user or enter passkey"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
