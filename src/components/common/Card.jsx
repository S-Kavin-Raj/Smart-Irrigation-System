import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, hover = false }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft transition-all duration-200 ${
        hover ? 'hover:shadow-card hover:border-slate-300' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
