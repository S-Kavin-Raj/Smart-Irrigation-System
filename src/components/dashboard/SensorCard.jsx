import React from 'react';
import { StatusBadge } from '../common/StatusBadge';

export const SensorCard = ({
  title,
  value,
  unit = '',
  status,
  icon: Icon,
  subtitle,
  variant = 'blue',
  active = false,
  footer
}) => {
  const iconColors = {
    blue: 'bg-brand-50 text-brand-600 border-brand-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  }[variant] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between ${
        active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconColors}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {status && <StatusBadge status={status} size="sm" />}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
          {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
        </div>
      </div>

      {footer && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
