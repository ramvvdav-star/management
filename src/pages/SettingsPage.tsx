import React, { useState } from 'react';
import {
  Server,
  KeyRound,
  Download,
  RotateCcw,
  CheckCircle2,
  Shield,
  Info,
  Layers,
  Users,
} from 'lucide-react';
import { AuthSession } from '../types';
import { resetCleanBaseline } from '../api';

interface SettingsPageProps {
  session: AuthSession;
  onOpenPasskeyModal: () => void;
  onRefreshData: () => void;
  isManager: boolean;
  accessKey?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  session,
  onOpenPasskeyModal,
  onRefreshData,
  isManager,
  accessKey,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCleanBaseline = async () => {
    if (!isManager) {
      alert('Manager permission is required to reset database baseline.');
      onOpenPasskeyModal();
      return;
    }

    if (
      !window.confirm(
        'Confirm Clean Database Reset? This resets the database strictly to the initial 4 employees (Hardik, Abhishek, Kaushik, Himanshu) and clean departments, clearing all projects and tasks.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    setFeedback(null);
    try {
      const res = await resetCleanBaseline(accessKey);
      setFeedback(res.message);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to clean baseline');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings & Access</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based authorization session, database persistence telemetry, and baseline management.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Active Session & Permission Card */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active Authorization Session</h3>
              <p className="text-xs text-slate-400">
                Current Role: <strong className="text-cyan-400">{session.role}</strong>
                {session.employeeName && ` · Signed in as ${session.employeeName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPasskeyModal}
            className="px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors"
          >
            Switch Role / PIN
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100 block">Manager Permissions</span>
            <ul className="text-slate-400 space-y-0.5 list-disc pl-4 text-[11px]">
              <li>Create, edit, and delete projects</li>
              <li>Create and manage departments</li>
              <li>Add and remove employees</li>
              <li>Create and assign tasks</li>
              <li>Generate company reports</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100 block">Employee Permissions</span>
            <ul className="text-slate-400 space-y-0.5 list-disc pl-4 text-[11px]">
              <li>View company projects and health</li>
              <li>View assigned tasks</li>
              <li>Submit granular task progress (0-100%)</li>
              <li>Log time spent and describe blockers</li>
              <li>Add team comments to tasks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Initial 4 Employees Information */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Core Team Staff (Default Baseline)</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          The company starts with the four core team members. Each staff member has a default PIN corresponding to their Employee ID:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <strong className="text-cyan-300 block">Hardik</strong>
            <span className="text-slate-400 text-[10px]">Manager · PIN: 1001</span>
          </div>
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <strong className="text-cyan-300 block">Abhishek</strong>
            <span className="text-slate-400 text-[10px]">Manager · PIN: 1002</span>
          </div>
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block">Kaushik</strong>
            <span className="text-slate-400 text-[10px]">Employee · PIN: 1003</span>
          </div>
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block">Himanshu</strong>
            <span className="text-slate-400 text-[10px]">Employee · PIN: 1004</span>
          </div>
        </div>
      </div>

      {/* Database Persistence & Clean Slate */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Database Persistence & Maintenance</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          All records persist centrally on the server (<code className="text-cyan-400">/data/esecurityin_db.json</code>) and synchronize across browsers and devices.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="/api/database/backup"
            download
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Database JSON Backup</span>
          </a>

          {isManager && (
            <button
              onClick={handleCleanBaseline}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>{isResetting ? 'Resetting...' : 'Reset to Clean 4-Employee Baseline'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
