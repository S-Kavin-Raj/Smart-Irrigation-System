import React from 'react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { SensorGrid } from '../components/dashboard/SensorGrid';
import { PumpControlCard } from '../components/dashboard/PumpControlCard';
import { AutoModeStatusCard } from '../components/dashboard/AutoModeStatusCard';
import { LiveTrendPreview } from '../components/dashboard/LiveTrendPreview';
import { HistoryTable } from '../components/history/HistoryTable';

export const DashboardPage = () => {
  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* 1. Irrigation Summary KPIs */}
      <SummaryCards />

      {/* 2. Sensor Cards Grid */}
      <SensorGrid />

      {/* 3. Pump Control + Auto Mode Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PumpControlCard />
        </div>
        <div className="lg:col-span-4">
          <AutoModeStatusCard />
        </div>
      </div>

      {/* 4. Live Trend Visualizer */}
      <LiveTrendPreview />

      {/* 5. Recent Irrigation Events Table */}
      <HistoryTable limit={5} />
    </div>
  );
};
