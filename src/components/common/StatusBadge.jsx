import React from 'react';

export const StatusBadge = ({ status, variant, size = 'md' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = (status || '').toLowerCase();

  if (normalized.includes('online') || normalized.includes('on') || normalized.includes('completed') || normalized.includes('wet') || normalized.includes('normal')) {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized.includes('dry') || normalized.includes('starting') || normalized.includes('stopped') || normalized.includes('waiting')) {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized.includes('offline') || normalized.includes('error') || normalized.includes('rain detected') || normalized.includes('failed')) {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (normalized.includes('auto') || normalized.includes('manual')) {
    colorStyles = 'bg-brand-50 text-brand-700 border-brand-200';
  }

  if (variant === 'blue') {
    colorStyles = 'bg-brand-50 text-brand-700 border-brand-200';
  } else if (variant === 'green') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'amber') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (variant === 'red') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles} ${colorStyles} transition-colors`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};
