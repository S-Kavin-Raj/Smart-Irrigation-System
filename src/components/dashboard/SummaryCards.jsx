import React from 'react';
import { useIrrigation } from '../../context/IrrigationContext';
import { formatDuration, formatDate } from '../../utils/formatters';
import { PlayCircle, Clock, Power, History } from 'lucide-react';

export const SummaryCards = () => {
  const { history, pumpState, deviceConnected } = useIrrigation();

  const todayStr = formatDate(new Date());
  const todayHistory = deviceConnected ? history.filter((item) => item.date === todayStr) : [];

  // When device is disconnected, summary values MUST display "--"
  const todayRuns = deviceConnected ? todayHistory.length : '--';
  const todayTotalSeconds = deviceConnected
    ? todayHistory.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0)
    : null;
  const wateringTimeText = deviceConnected
    ? formatDuration(todayTotalSeconds)
    : '--';

  const lastRun = deviceConnected && history.length > 0 ? history[0] : null;
  const lastIrrigationText = deviceConnected
    ? (lastRun ? (lastRun.startTime || lastRun.date) : 'None recorded')
    : '--';

  const pumpStatusText = deviceConnected
    ? pumpState
    : '--';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Today's Runs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <PlayCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Today's Runs</span>
        </div>
        <div className="text-2xl font-bold text-slate-900">{todayRuns}</div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {deviceConnected ? 'Real cycles completed today' : 'No data available'}
        </span>
      </div>

      {/* 2. Total Watering Time Today */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Watering Time</span>
        </div>
        <div className="text-2xl font-bold text-slate-900">{wateringTimeText}</div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {deviceConnected ? 'Actual duration logged' : 'No data available'}
        </span>
      </div>

      {/* 3. Current Pump Status */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Power className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Pump Relay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900">{pumpStatusText}</span>
          {deviceConnected && (
            <span
              className={`w-2 h-2 rounded-full ${
                pumpState === 'ON' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
              }`}
            />
          )}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {deviceConnected
            ? (pumpState === 'ON' ? 'Active 12V Supply' : 'Motor idle / Standby')
            : 'Unknown — device offline'}
        </span>
      </div>

      {/* 4. Last Irrigation */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Last Irrigation</span>
        </div>
        <div className="text-xl font-bold text-slate-900 truncate">
          {lastIrrigationText}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {deviceConnected
            ? (lastRun ? (lastRun.durationText || `${lastRun.durationSeconds}s`) : 'Awaiting first run')
            : 'No data available'}
        </span>
      </div>
    </div>
  );
};
