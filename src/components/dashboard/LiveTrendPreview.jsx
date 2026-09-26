import React, { useState } from 'react';
import { Card } from '../common/Card';
import { useIrrigation } from '../../context/IrrigationContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Droplets, Thermometer, Wind, WifiOff } from 'lucide-react';

export const LiveTrendPreview = () => {
  const { trendData, deviceConnected } = useIrrigation();
  const [selectedMetric, setSelectedMetric] = useState('soilMoisture');

  const metricConfig = {
    soilMoisture: {
      label: 'Soil Moisture',
      unit: '%',
      color: '#0c8ce9',
      icon: Droplets,
    },
    temperature: {
      label: 'DHT11 Temperature',
      unit: '°C',
      color: '#f59e0b',
      icon: Thermometer,
    },
    humidity: {
      label: 'DHT11 Humidity',
      unit: '%',
      color: '#6366f1',
      icon: Wind,
    },
  };

  const activeConfig = metricConfig[selectedMetric];
  const hasData = deviceConnected && Array.isArray(trendData) && trendData.length > 0;

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            Telemetry Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry gathered by ESP8266 NodeMCU
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {Object.entries(metricConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{config.label}</span>
                <span className="md:hidden">{config.unit}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart or Empty Notice */}
      {!hasData ? (
        <div className="h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center p-4">
          <WifiOff className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-600">No historical telemetry yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {deviceConnected
              ? 'Awaiting telemetry samples from ESP8266...'
              : 'Connect the ESP8266 to view historical telemetry trends.'}
          </p>
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit={activeConfig.unit}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 15px -2px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} ${activeConfig.unit}`, activeConfig.label]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={activeConfig.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#metricGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
