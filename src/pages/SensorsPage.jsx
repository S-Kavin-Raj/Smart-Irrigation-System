import React, { useState } from 'react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { useIrrigation } from '../context/IrrigationContext';
import { getMoistureStatus } from '../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Droplets, Thermometer, Wind, CloudRain, Zap, WifiOff } from 'lucide-react';

export const SensorsPage = () => {
  const { sensorData, trendData, deviceConnected } = useIrrigation();
  const [chartTimeframe, setChartTimeframe] = useState('24h');

  const soilMoistureVal = (deviceConnected && sensorData?.soilMoisture !== undefined)
    ? sensorData.soilMoisture
    : '--';

  const temperatureVal = (deviceConnected && sensorData?.temperature !== undefined)
    ? sensorData.temperature
    : '--';

  const humidityVal = (deviceConnected && sensorData?.humidity !== undefined)
    ? sensorData.humidity
    : '--';

  const rainVal = (deviceConnected && sensorData?.rainDetected !== undefined)
    ? (sensorData.rainDetected ? 'Rain Detected' : 'No Rain')
    : '--';

  const moistureStatus = (deviceConnected && typeof soilMoistureVal === 'number')
    ? getMoistureStatus(soilMoistureVal)
    : null;

  const hasTrendData = deviceConnected && Array.isArray(trendData) && trendData.length > 0;
  const displayedTrend = hasTrendData
    ? (chartTimeframe === '6h' ? trendData.slice(-7) : chartTimeframe === '12h' ? trendData.slice(-13) : trendData)
    : [];

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Header and Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sensors & Telemetry Analysis</h2>
          <p className="text-xs text-slate-500">
            Real-time reading diagnostics and historical sensor curve comparisons
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          {['6h', '12h', '24h'].map((tf) => (
            <button
              key={tf}
              type="button"
              disabled={!deviceConnected}
              onClick={() => setChartTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                !deviceConnected
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : chartTimeframe === tf
                  ? 'bg-white text-brand-700 shadow-xs cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 cursor-pointer'
              }`}
            >
              Last {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soil Moisture Big Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            {moistureStatus && <StatusBadge status={moistureStatus} size="sm" />}
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Soil Moisture (Capacitive)
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {soilMoistureVal}{typeof soilMoistureVal === 'number' ? '%' : ''}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target: 45% - 70% | Routed via CD74HC4067 MUX to ESP8266 A0
          </p>
        </div>

        {/* Temperature Big Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            {deviceConnected && typeof temperatureVal === 'number' && (
              <StatusBadge status="DHT11 Temp" variant="amber" size="sm" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Temperature
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {temperatureVal}{typeof temperatureVal === 'number' ? ' °C' : ''}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {typeof temperatureVal === 'number' ? `Fahrenheit: ${(temperatureVal * 1.8 + 32).toFixed(1)} °F | ` : ''}Digital GPIO D4
          </p>
        </div>

        {/* Humidity Big Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            {deviceConnected && typeof humidityVal === 'number' && (
              <StatusBadge status="DHT11 Hum" variant="blue" size="sm" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Atmospheric Humidity
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {humidityVal}{typeof humidityVal === 'number' ? '%' : ''}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Relative air moisture | Digital GPIO D4
          </p>
        </div>

        {/* Rain Detection */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CloudRain className="w-5 h-5" />
            </div>
            {deviceConnected && (
              <StatusBadge status={rainVal === 'Rain Detected' ? 'Rain Active' : 'Clear Sky'} size="sm" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Rain Sensor (FC-37)
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {rainVal}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Analog rain detection via CD74HC4067 MUX to ESP8266 A0
          </p>
        </div>
      </div>

      {/* Deep Dive Multi-Charts or Empty State */}
      {!hasTrendData ? (
        <Card title="Sensor Trend Telemetry" subtitle="Historical telemetry from ESP8266">
          <div className="py-12 flex flex-col items-center justify-center text-center p-4">
            <WifiOff className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No Historical Telemetry Data</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
              Connect the ESP8266 controller to stream real-time telemetry curves.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Soil Moisture Telemetry" subtitle="Historical soil absorption levels">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="soilMoisture" name="Soil Moisture (%)" stroke="#0c8ce9" fill="#0c8ce9" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Temperature & Humidity (DHT11)" subtitle="Ambient climate data">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Hardware Pinout & Wiring Reference Card */}
      <Card title="ESP8266 Hardware Mapping & Prototype Wiring" subtitle="Final hardware implementation with CD74HC4067 multiplexer and buck converter">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">Soil Moisture Sensor</span>
            <span className="text-slate-600 block mt-1 font-medium">Through CD74HC4067 MUX</span>
            <span className="text-slate-400 block mt-0.5">MUX CH0 &rarr; ESP8266 Pin A0</span>
            <span className="text-slate-400 block mt-0.5">VCC: 3.3V | GND: GND</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">FC-37 Rain Sensor</span>
            <span className="text-slate-600 block mt-1 font-medium">Through CD74HC4067 MUX</span>
            <span className="text-slate-400 block mt-0.5">MUX CH1 &rarr; ESP8266 Pin A0</span>
            <span className="text-slate-400 block mt-0.5">VCC: 3.3V | GND: GND</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">CD74HC4067 Multiplexer</span>
            <span className="text-slate-600 block mt-1 font-medium">16-Channel Analog MUX</span>
            <span className="text-slate-400 block mt-0.5">Common SIG &rarr; NodeMCU Pin A0</span>
            <span className="text-slate-400 block mt-0.5">Address: S0-S3 | EN: GND</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">DHT11 Temp & Humidity</span>
            <span className="text-slate-600 block mt-1 font-medium">Digital 1-Wire Telemetry</span>
            <span className="text-slate-400 block mt-0.5">Data Pin: GPIO 2 (D4)</span>
            <span className="text-slate-400 block mt-0.5">VCC: 3.3V | GND: GND</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">5V Relay Module (Pump)</span>
            <span className="text-slate-600 block mt-1 font-medium">Actuator Trigger on D1</span>
            <span className="text-slate-400 block mt-0.5">IN: GPIO 5 (D1) | VCC: 5V (Buck)</span>
            <span className="text-slate-400 block mt-0.5">Switches 12V Supply to DC Pump</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">Power Infrastructure</span>
            <span className="text-slate-600 block mt-1 font-medium">12V Supply & Buck Converter</span>
            <span className="text-slate-400 block mt-0.5">12V DC &rarr; Pump Supply</span>
            <span className="text-slate-400 block mt-0.5">12V-to-5V Buck &rarr; NodeMCU Vin & Relay</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
