import React, { useState, useEffect } from 'react';
import {
  Server,
  KeyRound,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';
import { AuthSession } from '../types';
import { resetCleanBaseline, isBackendConnected } from '../api';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getDirectSupabaseClient,
} from '../clientStorage';

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

  // Supabase connection state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState('');

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.anonKey);
    if (cfg.url && cfg.anonKey) {
      setSupabaseStatus('connected');
    }
  }, []);

  const handleSaveSupabase = async () => {
    setSupabaseStatus('testing');
    setSupabaseErrorMsg('');

    const cleanUrl = supabaseUrl.trim();
    const cleanKey = supabaseAnonKey.trim();

    if (!cleanUrl || !cleanKey) {
      saveSupabaseConfig({ url: '', anonKey: '' });
      setSupabaseStatus('idle');
      setFeedback('Supabase credentials cleared. Using local browser storage.');
      return;
    }

    try {
      saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });
      const client = getDirectSupabaseClient();
      if (!client) throw new Error('Could not initialize Supabase client');

      // Test connection with lightweight select
      const { data, error } = await client.from('departments').select('id').limit(1);
      if (error) {
        throw new Error(error.message);
      }

      setSupabaseStatus('connected');
      setFeedback('Successfully connected to Supabase Cloud PostgreSQL!');
      onRefreshData();
    } catch (err: any) {
      setSupabaseStatus('error');
      setSupabaseErrorMsg(err.message || 'Connection test failed. Check URL, Anon Key, and verify you ran the SQL schema.');
    }
  };

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

  const backendActive = isBackendConnected();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto text-xs">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings & Database Integration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based authorization session, Supabase cloud synchronization, and system baseline controls.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Database Connection Status Banner */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active Database Engine</h3>
              <p className="text-xs text-slate-400">
                {supabaseStatus === 'connected' ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected to Supabase PostgreSQL Cloud
                  </span>
                ) : backendActive ? (
                  <span className="text-cyan-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Express Full-Stack Server (/data/esecurityin_db.json)
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Standalone In-Browser Engine (Persistent Local Storage)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
              Vercel & Offline Ready
            </span>
          </div>
        </div>

        {/* Supabase Setup Inputs */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Supabase Cloud Database Settings</span>
            <span className="text-[11px] text-slate-400">
              Free PostgreSQL cloud database from{' '}
              <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Supabase Anon Public API Key (Not service_role)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOi..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <p>
              <strong className="text-cyan-300">Which key to use?</strong> In Supabase Dashboard &rarr; <strong>Project Settings &rarr; API</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
              <li>Use the <span className="text-emerald-400 font-mono">anon public</span> key for browser applications.</li>
              <li>Do <strong className="text-amber-400">NOT</strong> paste the <span className="text-red-400 font-mono">service_role</span> key into the client.</li>
              <li>Make sure you run the SQL script in <code className="text-cyan-400">supabase/schema.sql</code> in the Supabase SQL Editor once so tables & public RLS policies are created.</li>
            </ul>
          </div>

          {supabaseErrorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{supabaseErrorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveSupabase}
              disabled={supabaseStatus === 'testing'}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl cursor-pointer transition-colors disabled:opacity-50 text-xs shadow-md shadow-cyan-950"
            >
              <Save className="w-4 h-4" />
              <span>{supabaseStatus === 'testing' ? 'Testing Connection...' : 'Save & Connect Supabase'}</span>
            </button>

            {supabaseStatus === 'connected' && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                <Check className="w-4 h-4" /> Connected
              </span>
            )}
          </div>
        </div>
      </div>

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

      {/* Database Maintenance & Clean Slate */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Database Maintenance & Clean Slate</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          All data synchronizes seamlessly. You can backup local data or reset strictly to the 4-employee baseline (Hardik, Abhishek, Kaushik, Himanshu) and 0 projects.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {backendActive && (
            <a
              href="/api/database/backup"
              download
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Database JSON Backup</span>
            </a>
          )}

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
