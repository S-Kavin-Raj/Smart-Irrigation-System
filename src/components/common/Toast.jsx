import React from 'react';
import { useIrrigation } from '../../context/IrrigationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useIrrigation();

  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-white border-emerald-200 text-emerald-800 shadow-lg shadow-emerald-500/10',
    warning: 'bg-white border-amber-200 text-amber-800 shadow-lg shadow-amber-500/10',
    error: 'bg-white border-rose-200 text-rose-800 shadow-lg shadow-rose-500/10',
    info: 'bg-white border-brand-200 text-brand-900 shadow-lg shadow-brand-500/10',
  };

  const iconColors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-rose-500',
    info: 'text-brand-500',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const IconComponent = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${colors[toast.type] || colors.info} transition-all duration-200 animate-slide-up`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type] || iconColors.info}`} />
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold text-slate-800 mb-0.5">{toast.title}</div>}
              <div className="text-slate-600 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
