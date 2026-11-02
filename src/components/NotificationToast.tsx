import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const Icon =
    notification.type === 'success'
      ? CheckCircle2
      : notification.type === 'error'
      ? AlertCircle
      : Info;

  const colorStyles =
    notification.type === 'success'
      ? 'border-emerald-600 bg-slate-900 text-emerald-300'
      : notification.type === 'error'
      ? 'border-red-600 bg-slate-900 text-red-300'
      : 'border-cyan-600 bg-slate-900 text-cyan-300';

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start justify-between gap-3 text-xs transition-all animate-in slide-in-from-bottom-2 ${colorStyles}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-100">{notification.title}</h4>
          {notification.message && (
            <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
              {notification.message}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
