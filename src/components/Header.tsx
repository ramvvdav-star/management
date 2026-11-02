import React from 'react';
import { Menu, Plus, RefreshCw, KeyRound, Shield } from 'lucide-react';
import { AuthSession } from '../types';

interface HeaderProps {
  currentPageTitle: string;
  onOpenMobileMenu: () => void;
  onOpenCreateProject: () => void;
  onOpenCreateTask: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  session: AuthSession;
  onOpenPasskeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPageTitle,
  onOpenMobileMenu,
  onOpenCreateProject,
  onOpenCreateTask,
  onRefreshData,
  isRefreshing = false,
  session,
  onOpenPasskeyModal,
}) => {
  return (
    <header className="h-16 px-4 md:px-6 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-semibold text-slate-400">eSecurityIn</span>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-slate-100">{currentPageTitle}</h1>
        </div>
      </div>

      {/* Zone 2: Role / Passkey indicator */}
      <div className="hidden md:flex items-center gap-3 text-xs">
        <button
          onClick={onOpenPasskeyModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {session.employeeName
              ? `${session.employeeName} (${session.role})`
              : session.role === 'Manager'
              ? 'Manager Mode'
              : 'Guest Viewer (Click to Authenticate)'}
          </span>
        </button>
      </div>

      {/* Zone 3: Actions & Refresh */}
      <div className="flex items-center gap-2">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh records"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        <button
          onClick={onOpenCreateTask}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
          <span>New Task</span>
        </button>

        <button
          onClick={onOpenCreateProject}
          className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
