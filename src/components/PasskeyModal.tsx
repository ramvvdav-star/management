import React, { useState } from 'react';
import { KeyRound, Shield, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyAccessKey } from '../api';
import { AuthSession } from '../types';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  currentSession: AuthSession;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentSession,
}) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passkey.trim()) {
      setError('Please enter your Employee PIN or Master Key.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyAccessKey(passkey.trim());
      onSuccess({
        role: res.role,
        employeeId: res.employeeId,
        employeeName: res.employeeName,
        isAuthenticated: true,
        accessKey: passkey.trim(),
      });
      setPasskey('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid access key');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectQuick = async (key: string) => {
    setPasskey(key);
    setError(null);
    setIsVerifying(true);
    try {
      const res = await verifyAccessKey(key);
      onSuccess({
        role: res.role,
        employeeId: res.employeeId,
        employeeName: res.employeeName,
        isAuthenticated: true,
        accessKey: key,
      });
      setPasskey('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid access key');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <KeyRound className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Access Key & Role Authorization</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300 leading-relaxed">
          eSecurityIn uses a secure passkey model without password fatigue. Enter your Employee PIN to authorize management actions or progress updates.
        </p>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Employee PIN or Master Key
            </label>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="e.g. 1001, 1002, 1003, 1004 or Master Key"
              autoFocus
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono tracking-widest text-center"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Authorize Session'}
            </button>
          </div>
        </form>

        {/* Quick Staff Selection for frictionless internal collaboration */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
            Quick Staff Presets (Initial Team):
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectQuick('1001')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 cursor-pointer transition-colors"
            >
              <span className="font-bold block text-cyan-300">Hardik</span>
              <span className="text-[10px] text-slate-400">Manager · PIN: 1001</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick('1002')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 cursor-pointer transition-colors"
            >
              <span className="font-bold block text-cyan-300">Abhishek</span>
              <span className="text-[10px] text-slate-400">Manager · PIN: 1002</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick('1003')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 cursor-pointer transition-colors"
            >
              <span className="font-bold block text-slate-200">Kaushik</span>
              <span className="text-[10px] text-slate-400">Employee · PIN: 1003</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick('1004')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 cursor-pointer transition-colors"
            >
              <span className="font-bold block text-slate-200">Himanshu</span>
              <span className="text-[10px] text-slate-400">Employee · PIN: 1004</span>
            </button>
          </div>
        </div>

        {currentSession.isAuthenticated && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                onSuccess({
                  role: 'Employee',
                  isAuthenticated: false,
                  accessKey: undefined,
                  employeeId: undefined,
                  employeeName: undefined,
                });
                onClose();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
            >
              Switch to Read-Only Guest Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
