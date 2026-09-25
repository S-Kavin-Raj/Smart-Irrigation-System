import React from 'react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { HistoryTable } from '../components/history/HistoryTable';
import { SummaryCards } from '../components/dashboard/SummaryCards';

export const HistoryPage = () => {
  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Irrigation Run History</h2>
          <p className="text-xs text-slate-500">
            Real records logged from ESP8266 controller operations
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <SummaryCards />

      {/* Complete History Table */}
      <HistoryTable />
    </div>
  );
};
