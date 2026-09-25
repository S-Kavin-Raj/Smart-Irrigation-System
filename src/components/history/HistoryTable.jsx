import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { useIrrigation } from '../../context/IrrigationContext';
import { Filter, ArrowUpDown, Calendar, Search, Download, Clock, WifiOff } from 'lucide-react';

export const HistoryTable = ({ limit }) => {
  const { history, deviceConnected } = useIrrigation();

  const [modeFilter, setModeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered and Sorted list
  const filteredHistory = useMemo(() => {
    if (!deviceConnected || !Array.isArray(history)) {
      return [];
    }

    let list = [...history];

    if (modeFilter !== 'ALL') {
      list = list.filter((item) => item.mode === modeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.date?.toLowerCase().includes(q) ||
          item.trigger?.toLowerCase().includes(q) ||
          item.status?.toLowerCase().includes(q) ||
          item.mode?.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'asc') {
      list.reverse();
    }

    if (limit) {
      list = list.slice(0, limit);
    }

    return list;
  }, [history, modeFilter, sortOrder, searchQuery, limit, deviceConnected]);

  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['Date', 'Start Time', 'End Time', 'Duration (s)', 'Duration', 'Mode', 'Trigger', 'Status'];
    const rows = filteredHistory.map((h) => [
      h.date,
      h.startTime,
      h.endTime,
      h.durationSeconds,
      `"${h.durationText || ''}"`,
      h.mode,
      `"${h.trigger || ''}"`,
      h.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `irrigation_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      {/* Table Controls / Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {limit ? 'Recent Irrigation Events' : 'Irrigation History Log'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {deviceConnected
              ? `${filteredHistory.length} recorded session${filteredHistory.length === 1 ? '' : 's'}`
              : 'Device disconnected'}
          </p>
        </div>

        {/* Filter Controls (Disabled when offline) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            {['ALL', 'AUTO', 'MANUAL'].map((m) => (
              <button
                key={m}
                type="button"
                disabled={!deviceConnected}
                onClick={() => setModeFilter(m)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !deviceConnected
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : modeFilter === m
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={ArrowUpDown}
            disabled={!deviceConnected || filteredHistory.length === 0}
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          >
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>

          {!limit && (
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              disabled={!deviceConnected || filteredHistory.length === 0}
              onClick={exportToCSV}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Search Input on Full History page */}
      {!limit && deviceConnected && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by date, trigger, or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Disconnected State */}
      {!deviceConnected ? (
        <div className="py-12 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <WifiOff className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Connect the ESP8266 to retrieve irrigation history.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        /* Connected but empty history */
        <div className="py-10 text-center text-slate-500 text-xs">
          No irrigation history yet.
        </div>
      ) : (
        /* Desktop Table View */
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Start Time</th>
                  <th className="pb-3 px-3">End Time</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Mode</th>
                  <th className="pb-3 px-3">Trigger</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.startTime}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.endTime}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-brand-700 whitespace-nowrap">
                      {item.durationText || `${item.durationSeconds}s`}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.mode === 'AUTO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}
                      >
                        {item.mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {item.trigger}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block sm:hidden space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{item.date}</span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className="font-bold text-brand-700">{item.durationText || `${item.durationSeconds}s`}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">{item.trigger}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      item.mode === 'AUTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800'
                    }`}
                  >
                    {item.mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
